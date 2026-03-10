import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { ForbiddenError, NotFoundError } from '../lib/errors'

import type {
  CreateAnnouncementSchemaInput,
  SendDirectMessageSchemaInput,
  UpdateAnnouncementSchemaInput,
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

const DIRECT_MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  readAt: true,
  createdAt: true,
  sender: { select: USER_SUMMARY_SELECT },
}

const ANNOUNCEMENT_SELECT = {
  id: true,
  organizationId: true,
  authorId: true,
  subject: true,
  body: true,
  targetRole: true,
  scheduledAt: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
  author: { select: USER_SUMMARY_SELECT },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Canonical ordering: always store the lexicographically-smaller id as participantA.
 * This guarantees the @@unique([organizationId, participantAId, participantBId]) works
 * regardless of which user initiates the conversation.
 */
function canonicalParticipants(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA]
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export interface ListConversationsQuery {
  page?: string
  perPage?: string
}

export async function listConversations(
  fastify: FastifyInstance,
  organizationId: string,
  userId: string,
  query: ListConversationsQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)

  const where = {
    organizationId,
    OR: [{ participantAId: userId }, { participantBId: userId }],
  }

  const [conversations, total] = await Promise.all([
    fastify.prisma.conversation.findMany({
      where,
      include: {
        participantA: { select: USER_SUMMARY_SELECT },
        participantB: { select: USER_SUMMARY_SELECT },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true, senderId: true, createdAt: true },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take,
    }),
    fastify.prisma.conversation.count({ where }),
  ])

  // Attach unread count per conversation
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await fastify.prisma.directMessage.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          readAt: null,
        },
      })
      return {
        ...conv,
        latestMessage: conv.messages[0] ?? null,
        unreadCount,
      }
    })
  )

  return { conversations: enriched, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getOrCreateConversation(
  fastify: FastifyInstance,
  organizationId: string,
  currentUserId: string,
  otherUserId: string
) {
  // Verify other user exists in same org
  const otherUser = await fastify.prisma.user.findFirst({
    where: { id: otherUserId, organizationId, isActive: true },
    select: USER_SUMMARY_SELECT,
  })
  if (!otherUser) {
    throw new NotFoundError('User not found')
  }

  const [participantAId, participantBId] = canonicalParticipants(currentUserId, otherUserId)

  const conversation = await fastify.prisma.conversation.upsert({
    where: {
      organizationId_participantAId_participantBId: {
        organizationId,
        participantAId,
        participantBId,
      },
    },
    create: {
      organizationId,
      participantAId,
      participantBId,
    },
    update: {},
    include: {
      participantA: { select: USER_SUMMARY_SELECT },
      participantB: { select: USER_SUMMARY_SELECT },
    },
  })

  return conversation
}

export interface GetConversationMessagesQuery {
  page?: string
  perPage?: string
}

export async function getConversationMessages(
  fastify: FastifyInstance,
  organizationId: string,
  conversationId: string,
  userId: string,
  query: GetConversationMessagesQuery
) {
  const conversation = await fastify.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
  })
  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  const { page, perPage, skip, take } = parsePagination(query)

  const [messages, total] = await Promise.all([
    fastify.prisma.directMessage.findMany({
      where: { conversationId },
      select: DIRECT_MESSAGE_SELECT,
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
    fastify.prisma.directMessage.count({ where: { conversationId } }),
  ])

  // Mark unread messages (sent by the other participant) as read
  await fastify.prisma.directMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return { messages, meta: buildPaginationMeta(total, page, perPage) }
}

export async function sendDirectMessage(
  fastify: FastifyInstance,
  organizationId: string,
  conversationId: string,
  senderId: string,
  input: SendDirectMessageSchemaInput
) {
  const conversation = await fastify.prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId,
      OR: [{ participantAId: senderId }, { participantBId: senderId }],
    },
  })
  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  const [message] = await fastify.prisma.$transaction([
    fastify.prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        body: input.body,
      },
      select: DIRECT_MESSAGE_SELECT,
    }),
    fastify.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ])

  return message
}

// ─── Announcements ────────────────────────────────────────────────────────────

const ANNOUNCEMENT_AUTHOR_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin']

export interface ListAnnouncementsQuery {
  page?: string
  perPage?: string
}

export async function listAnnouncements(
  fastify: FastifyInstance,
  organizationId: string,
  userId: string,
  userRoles: string[],
  query: ListAnnouncementsQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)

  // User sees announcements targeting their role(s) or all users (targetRole is null)
  const where = {
    organizationId,
    sentAt: { not: null as Date | null },
    OR: [
      { targetRole: null },
      { targetRole: { in: userRoles } },
    ],
  }

  const [announcements, total] = await Promise.all([
    fastify.prisma.announcement.findMany({
      where,
      select: {
        ...ANNOUNCEMENT_SELECT,
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
      orderBy: { sentAt: 'desc' },
      skip,
      take,
    }),
    fastify.prisma.announcement.count({ where }),
  ])

  const enriched = announcements.map((a) => ({
    ...a,
    isRead: a.reads.length > 0,
    reads: undefined,
  }))

  return { announcements: enriched, meta: buildPaginationMeta(total, page, perPage) }
}

export async function listDraftAnnouncements(
  fastify: FastifyInstance,
  organizationId: string,
  authorId: string
) {
  // Drafts and scheduled — only visible to author or admins
  const announcements = await fastify.prisma.announcement.findMany({
    where: {
      organizationId,
      sentAt: null,
    },
    select: ANNOUNCEMENT_SELECT,
    orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
  })

  return announcements
}

export async function getAnnouncement(
  fastify: FastifyInstance,
  announcementId: string,
  organizationId: string,
  userId: string,
  userRoles: string[]
) {
  const announcement = await fastify.prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
    select: {
      ...ANNOUNCEMENT_SELECT,
      reads: {
        where: { userId },
        select: { readAt: true },
      },
    },
  })
  if (!announcement) {
    throw new NotFoundError('Announcement not found')
  }

  // Unsent announcements only visible to the author or announcement managers
  const canManage = userRoles.some((r) => ANNOUNCEMENT_AUTHOR_ROLES.includes(r))
  if (!announcement.sentAt && announcement.authorId !== userId && !canManage) {
    throw new ForbiddenError('Access denied')
  }

  return {
    ...announcement,
    isRead: announcement.reads.length > 0,
    reads: undefined,
  }
}

export async function createAnnouncement(
  fastify: FastifyInstance,
  organizationId: string,
  authorId: string,
  input: CreateAnnouncementSchemaInput
) {
  const now = new Date()
  // If no scheduledAt, send immediately
  const sentAt = input.scheduledAt ? null : now

  const announcement = await fastify.prisma.announcement.create({
    data: {
      organizationId,
      authorId,
      subject: input.subject,
      body: input.body,
      targetRole: input.targetRole ?? null,
      scheduledAt: input.scheduledAt ?? null,
      sentAt,
    },
    select: ANNOUNCEMENT_SELECT,
  })

  return announcement
}

export async function updateAnnouncement(
  fastify: FastifyInstance,
  announcementId: string,
  organizationId: string,
  userId: string,
  userRoles: string[],
  input: UpdateAnnouncementSchemaInput
) {
  const announcement = await fastify.prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
  })
  if (!announcement) {
    throw new NotFoundError('Announcement not found')
  }

  // Only author or admins can update
  const isAdmin = userRoles.some((r) => ['Admin', 'OfficeAdmin'].includes(r))
  if (announcement.authorId !== userId && !isAdmin) {
    throw new ForbiddenError('Only the author or an admin can edit this announcement')
  }

  // Cannot edit already-sent announcements
  if (announcement.sentAt) {
    throw new ForbiddenError('Cannot edit an announcement that has already been sent')
  }

  const updated = await fastify.prisma.announcement.update({
    where: { id: announcementId },
    data: input,
    select: ANNOUNCEMENT_SELECT,
  })

  return updated
}

export async function deleteAnnouncement(
  fastify: FastifyInstance,
  announcementId: string,
  organizationId: string,
  userId: string,
  userRoles: string[]
) {
  const announcement = await fastify.prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
  })
  if (!announcement) {
    throw new NotFoundError('Announcement not found')
  }

  const isAdmin = userRoles.some((r) => ['Admin', 'OfficeAdmin'].includes(r))
  if (announcement.authorId !== userId && !isAdmin) {
    throw new ForbiddenError('Only the author or an admin can delete this announcement')
  }

  if (announcement.sentAt) {
    throw new ForbiddenError('Cannot delete an announcement that has already been sent')
  }

  await fastify.prisma.announcement.delete({ where: { id: announcementId } })
}

export async function markAnnouncementRead(
  fastify: FastifyInstance,
  announcementId: string,
  organizationId: string,
  userId: string
) {
  const announcement = await fastify.prisma.announcement.findFirst({
    where: { id: announcementId, organizationId },
  })
  if (!announcement) {
    throw new NotFoundError('Announcement not found')
  }

  await fastify.prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId, userId } },
    create: { announcementId, userId },
    update: {},
  })
}

// ─── Unread Count ─────────────────────────────────────────────────────────────

export async function getUnreadCount(
  fastify: FastifyInstance,
  organizationId: string,
  userId: string,
  userRoles: string[]
) {
  const [directMessages, announcements] = await Promise.all([
    fastify.prisma.directMessage.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: {
          organizationId,
          OR: [{ participantAId: userId }, { participantBId: userId }],
        },
      },
    }),
    fastify.prisma.announcement.count({
      where: {
        organizationId,
        sentAt: { not: null },
        OR: [{ targetRole: null }, { targetRole: { in: userRoles } }],
        reads: { none: { userId } },
      },
    }),
  ])

  return { directMessages, announcements, total: directMessages + announcements }
}
