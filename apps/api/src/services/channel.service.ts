import { randomUUID } from 'crypto'
import path from 'path'

import {
  buildPaginationMeta,
  parsePagination,
  CHANNEL_MANAGE_ROLES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MINIO_BUCKET_NAME,
} from '@promanage/core'

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors'

import type {
  CreateChannelSchemaInput,
  UpdateChannelSchemaInput,
  SendChatMessageSchemaInput,
  UpdateChannelPermissionSchemaInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

// ─── Selects ─────────────────────────────────────────────────────────────────

const USER_SUMMARY_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
}

const CHANNEL_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  description: true,
  isPrivate: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
}

const ATTACHMENT_SELECT = {
  id: true,
  messageId: true,
  filename: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  createdAt: true,
}

const CHAT_MESSAGE_SELECT = {
  id: true,
  channelId: true,
  senderId: true,
  parentId: true,
  body: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  sender: { select: USER_SUMMARY_SELECT },
  attachments: { select: ATTACHMENT_SELECT },
  _count: { select: { replies: { where: { deletedAt: null } } } },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isManageRole(userRoles: string[]): boolean {
  return userRoles.some((r) => (CHANNEL_MANAGE_ROLES as readonly string[]).includes(r))
}

async function getChannelPermissionForUser(
  fastify: FastifyInstance,
  channelId: string,
  userRoles: string[]
): Promise<{ canRead: boolean; canWrite: boolean; canManage: boolean }> {
  const perms = await fastify.prisma.channelPermission.findMany({
    where: { channelId, roleName: { in: userRoles } },
  })

  // Union permissions: if any role grants a right, the user has it
  return {
    canRead: perms.some((p) => p.canRead),
    canWrite: perms.some((p) => p.canWrite),
    canManage: perms.some((p) => p.canManage),
  }
}

function sanitizeFilename(original: string): string {
  const ext = path.extname(original)
  const base = path.basename(original, ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  return `${base}${ext}`
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export interface ListChannelsQuery {
  page?: string
  perPage?: string
  projectId?: string
}

export async function listChannels(
  fastify: FastifyInstance,
  organizationId: string,
  userRoles: string[]
) {
  const canManage = isManageRole(userRoles)

  const channels = await fastify.prisma.channel.findMany({
    where: { organizationId },
    select: {
      ...CHANNEL_SELECT,
      permissions: {
        where: { roleName: { in: userRoles } },
        select: { canRead: true, canWrite: true, canManage: true },
      },
      _count: { select: { members: true, messages: { where: { deletedAt: null } } } },
    },
    orderBy: { name: 'asc' },
  })

  // Filter to channels where user has canRead (or is a manage-role, which gets full access)
  return channels.filter((c) => {
    if (canManage) return true
    return c.permissions.some((p) => p.canRead)
  })
}

export async function getChannel(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[]
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
    select: {
      ...CHANNEL_SELECT,
      permissions: true,
      members: {
        select: {
          channelId: true,
          userId: true,
          joinedAt: true,
          user: { select: USER_SUMMARY_SELECT },
        },
      },
      _count: { select: { messages: { where: { deletedAt: null } } } },
    },
  })

  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canRead } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canRead) {
    throw new ForbiddenError('Access denied')
  }

  return channel
}

export async function createChannel(
  fastify: FastifyInstance,
  organizationId: string,
  userId: string,
  userRoles: string[],
  input: CreateChannelSchemaInput
) {
  if (!isManageRole(userRoles)) {
    throw new ForbiddenError('Only Admin, ProjectManager, or OfficeAdmin can create channels')
  }

  // Check for slug uniqueness within org
  const existing = await fastify.prisma.channel.findFirst({
    where: { organizationId, slug: input.slug },
  })
  if (existing) {
    throw new ConflictError(`A channel with slug '${input.slug}' already exists`)
  }

  const defaultPermissions = [
    { roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
    { roleName: 'ProjectManager', canRead: true, canWrite: true, canManage: false },
    { roleName: 'Superintendent', canRead: true, canWrite: true, canManage: false },
    { roleName: 'Foreman', canRead: true, canWrite: true, canManage: false },
    { roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
    { roleName: 'OfficeAdmin', canRead: true, canWrite: true, canManage: false },
  ]

  const channel = await fastify.prisma.$transaction(async (tx) => {
    const created = await tx.channel.create({
      data: {
        organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        isPrivate: input.isPrivate ?? false,
        projectId: input.projectId ?? null,
      },
      select: CHANNEL_SELECT,
    })

    await tx.channelPermission.createMany({
      data: defaultPermissions.map((p) => ({ channelId: created.id, ...p })),
    })

    await tx.channelMember.create({
      data: { channelId: created.id, userId },
    })

    return created
  })

  return channel
}

export async function updateChannel(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[],
  input: UpdateChannelSchemaInput
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canManage } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canManage) {
    throw new ForbiddenError('Access denied')
  }

  // Slug uniqueness check if slug is being changed
  if (input.slug && input.slug !== channel.slug) {
    const existing = await fastify.prisma.channel.findFirst({
      where: { organizationId, slug: input.slug, id: { not: channelId } },
    })
    if (existing) {
      throw new ConflictError(`A channel with slug '${input.slug}' already exists`)
    }
  }

  const updated = await fastify.prisma.channel.update({
    where: { id: channelId },
    data: input,
    select: CHANNEL_SELECT,
  })

  // Notify channel members of the update
  fastify.io.to(`org:${organizationId}`).emit('channel:update', {
    channelId,
    name: updated.name,
    description: updated.description,
    updatedAt: updated.updatedAt,
  })

  return updated
}

export async function deleteChannel(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[]
) {
  if (!isManageRole(userRoles)) {
    throw new ForbiddenError('Only Admin, ProjectManager, or OfficeAdmin can delete channels')
  }

  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  await fastify.prisma.channel.delete({ where: { id: channelId } })

  fastify.io.to(`org:${organizationId}`).emit('channel:archived', {
    channelId,
    archivedAt: new Date().toISOString(),
  })
}

// ─── Channel Permissions ──────────────────────────────────────────────────────

export async function listChannelPermissions(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  return fastify.prisma.channelPermission.findMany({
    where: { channelId },
    orderBy: { roleName: 'asc' },
  })
}

export async function updateChannelPermission(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[],
  input: UpdateChannelPermissionSchemaInput
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canManage } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canManage) {
    throw new ForbiddenError('Access denied')
  }

  return fastify.prisma.channelPermission.upsert({
    where: { channelId_roleName: { channelId, roleName: input.roleName } },
    create: {
      channelId,
      roleName: input.roleName,
      canRead: input.canRead ?? true,
      canWrite: input.canWrite ?? true,
      canManage: input.canManage ?? false,
    },
    update: {
      ...(input.canRead !== undefined && { canRead: input.canRead }),
      ...(input.canWrite !== undefined && { canWrite: input.canWrite }),
      ...(input.canManage !== undefined && { canManage: input.canManage }),
    },
  })
}

// ─── Channel Members ──────────────────────────────────────────────────────────

export async function joinChannel(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userId: string,
  userRoles: string[]
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canRead } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canRead) {
    throw new ForbiddenError('Access denied')
  }

  await fastify.prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId },
    update: {},
  })

  fastify.io.to(`org:${organizationId}`).emit('channel:member:joined', { channelId, userId })
}

export async function leaveChannel(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userId: string
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const member = await fastify.prisma.channelMember.findFirst({
    where: { channelId, userId },
  })
  if (!member) {
    throw new NotFoundError('Not a member of this channel')
  }

  await fastify.prisma.channelMember.delete({
    where: { channelId_userId: { channelId, userId } },
  })

  fastify.io.to(`org:${organizationId}`).emit('channel:member:left', { channelId, userId })
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface ListMessagesQuery {
  page?: string
  perPage?: string
  parentId?: string
}

export async function listMessages(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[],
  query: ListMessagesQuery
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canRead } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canRead) {
    throw new ForbiddenError('Access denied')
  }

  const { page, perPage, skip, take } = parsePagination(query)

  const where = {
    channelId,
    parentId: query.parentId ?? null,
  }

  const [messages, total] = await Promise.all([
    fastify.prisma.chatMessage.findMany({
      where,
      select: CHAT_MESSAGE_SELECT,
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
    fastify.prisma.chatMessage.count({ where }),
  ])

  // Replace soft-deleted message content with placeholder,
  // but keep sender and always expose replyCount for UI consistency
  const normalized = messages.map((m) => {
    const base = {
      ...m,
      replyCount: m._count.replies,
      _count: undefined as unknown as undefined,
    }

    if (m.deletedAt) {
      return {
        ...base,
        body: '[deleted]',
        attachments: [],
      }
    }

    return base
  })

  return { messages: normalized, meta: buildPaginationMeta(total, page, perPage) }
}

export async function sendMessage(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userId: string,
  userRoles: string[],
  input: SendChatMessageSchemaInput
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canWrite } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canWrite) {
    throw new ForbiddenError('No write permission for this channel')
  }

  const message = await fastify.prisma.chatMessage.create({
    data: {
      channelId,
      senderId: userId,
      body: input.body,
      parentId: input.parentId ?? null,
    },
    select: CHAT_MESSAGE_SELECT,
  })

  const payload = { ...message, channelId, replyCount: 0, _count: undefined }
  fastify.io.to(`org:${organizationId}`).emit('channel:message', payload)

  return payload
}

export async function editMessage(
  fastify: FastifyInstance,
  messageId: string,
  channelId: string,
  organizationId: string,
  userId: string,
  body: string
) {
  const message = await fastify.prisma.chatMessage.findFirst({
    where: { id: messageId, channelId, channel: { organizationId } },
  })
  if (!message) {
    throw new NotFoundError('Message not found')
  }
  if (message.deletedAt) {
    throw new ForbiddenError('Cannot edit a deleted message')
  }
  if (message.senderId !== userId) {
    throw new ForbiddenError('Only the sender can edit this message')
  }

  const updated = await fastify.prisma.chatMessage.update({
    where: { id: messageId },
    data: { body, editedAt: new Date() },
    select: CHAT_MESSAGE_SELECT,
  })

  fastify.io.to(`org:${organizationId}`).emit('channel:message:edited', {
    messageId,
    channelId,
    body,
    editedAt: updated.editedAt?.toISOString(),
  })

  return { ...updated, replyCount: updated._count.replies, _count: undefined }
}

export async function deleteMessage(
  fastify: FastifyInstance,
  messageId: string,
  channelId: string,
  organizationId: string,
  userId: string,
  userRoles: string[]
) {
  const message = await fastify.prisma.chatMessage.findFirst({
    where: { id: messageId, channelId, channel: { organizationId } },
  })
  if (!message) {
    throw new NotFoundError('Message not found')
  }

  const { canManage } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  const isSender = message.senderId === userId
  const isAdmin = isManageRole(userRoles) || canManage

  if (!isSender && !isAdmin) {
    throw new ForbiddenError('Access denied')
  }

  await fastify.prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })

  fastify.io
    .to(`org:${organizationId}`)
    .emit('channel:message:deleted', { messageId, channelId })
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function getUploadUrl(
  fastify: FastifyInstance,
  channelId: string,
  organizationId: string,
  userRoles: string[],
  filename: string,
  mimeType: string,
  sizeBytes: number
) {
  const channel = await fastify.prisma.channel.findFirst({
    where: { id: channelId, organizationId },
  })
  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  const { canWrite } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canWrite) {
    throw new ForbiddenError('No write permission for this channel')
  }

  if (!(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError(`Unsupported file type: ${mimeType}`)
  }

  if (sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new ValidationError(`File exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES} bytes`)
  }

  if (sizeBytes <= 0) {
    throw new ValidationError('File must not be empty')
  }

  const safe = sanitizeFilename(filename)
  const storageKey = `attachments/${organizationId}/${channelId}/${randomUUID()}/${safe}`

  const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, storageKey, 300)

  return { uploadUrl, storageKey }
}

export async function confirmAttachment(
  fastify: FastifyInstance,
  messageId: string,
  channelId: string,
  organizationId: string,
  userId: string,
  data: {
    filename: string
    mimeType: string
    sizeBytes: number
    storageKey: string
  }
) {
  const message = await fastify.prisma.chatMessage.findFirst({
    where: { id: messageId, channelId, channel: { organizationId } },
  })
  if (!message) {
    throw new NotFoundError('Message not found')
  }
  if (message.senderId !== userId) {
    throw new ForbiddenError('Only the message sender can attach files')
  }

  return fastify.prisma.messageAttachment.create({
    data: {
      messageId,
      filename: data.filename,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storageKey: data.storageKey,
    },
    select: ATTACHMENT_SELECT,
  })
}

export async function getAttachmentDownloadUrl(
  fastify: FastifyInstance,
  attachmentId: string,
  channelId: string,
  organizationId: string,
  userRoles: string[]
) {
  const attachment = await fastify.prisma.messageAttachment.findFirst({
    where: { id: attachmentId, message: { channelId, channel: { organizationId } } },
    select: ATTACHMENT_SELECT,
  })
  if (!attachment) {
    throw new NotFoundError('Attachment not found')
  }

  const { canRead } = await getChannelPermissionForUser(fastify, channelId, userRoles)
  if (!isManageRole(userRoles) && !canRead) {
    throw new ForbiddenError('Access denied')
  }

  const downloadUrl = await fastify.minio.presignedGetObject(
    MINIO_BUCKET_NAME,
    attachment.storageKey,
    3600
  )

  return { downloadUrl, attachment }
}
