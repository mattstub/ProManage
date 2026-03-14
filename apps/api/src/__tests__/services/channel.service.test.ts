import { describe, it, expect, vi, beforeEach } from 'vitest'


import { ForbiddenError, NotFoundError, ValidationError } from '../../lib/errors'
import * as channelService from '../../services/channel.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { FastifyInstance } from 'fastify'
import type { Client as MinioClient } from 'minio'
import type { Server as SocketIoServer } from 'socket.io'

function buildMockFastify() {
  const prisma = createMockPrisma()
  const emit = vi.fn()
  const to = vi.fn().mockReturnValue({ emit })
  const io = { to, emit } as unknown as SocketIoServer
  const minio = {
    presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/presigned-put'),
    presignedGetObject: vi.fn().mockResolvedValue('https://minio.local/presigned-get'),
    statObject: vi.fn().mockResolvedValue({}),
  } as unknown as MinioClient
  return {
    fastify: { prisma, io, minio } as unknown as FastifyInstance,
    prisma,
    io: { to, emit },
    minio,
  }
}

const ORG_ID = 'org-1'
const CHANNEL_ID = 'chan-1'
const USER_ID = 'user-1'
const MESSAGE_ID = 'msg-1'

const baseChannel = {
  id: CHANNEL_ID,
  organizationId: ORG_ID,
  name: 'general',
  slug: 'general',
  description: null,
  isPrivate: false,
  projectId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const basePermissions = [
  { channelId: CHANNEL_ID, roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
  {
    channelId: CHANNEL_ID,
    roleName: 'FieldUser',
    canRead: true,
    canWrite: false,
    canManage: false,
  },
]

const baseMessage = {
  id: MESSAGE_ID,
  channelId: CHANNEL_ID,
  senderId: USER_ID,
  parentId: null,
  body: 'Hello world',
  editedAt: null,
  deletedAt: null,
  createdAt: new Date(),
  sender: { id: USER_ID, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', avatarUrl: null },
  attachments: [],
  _count: { replies: 0 },
}

// ─── listChannelPermissions ────────────────────────────────────────────────────

describe('channelService.listChannelPermissions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns permissions for a channel the user can read', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    // User has canRead=true via FieldUser role
    prisma.channelPermission.findMany
      .mockResolvedValueOnce([
        { channelId: CHANNEL_ID, roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
      ]) // getChannelPermissionForUser call
      .mockResolvedValueOnce(basePermissions) // listChannelPermissions result

    const result = await channelService.listChannelPermissions(
      fastify,
      CHANNEL_ID,
      ORG_ID,
      ['FieldUser']
    )

    expect(result).toEqual(basePermissions)
  })

  it('returns permissions for a manage-role user even without explicit canRead', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    prisma.channelPermission.findMany
      .mockResolvedValueOnce([]) // no explicit permission record
      .mockResolvedValueOnce(basePermissions)

    const result = await channelService.listChannelPermissions(
      fastify,
      CHANNEL_ID,
      ORG_ID,
      ['Admin']
    )

    expect(result).toEqual(basePermissions)
  })

  it('throws ForbiddenError when user cannot read the channel', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    // No permissions for this role
    prisma.channelPermission.findMany.mockResolvedValue([])

    await expect(
      channelService.listChannelPermissions(fastify, CHANNEL_ID, ORG_ID, ['FieldUser'])
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when channel does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(null)

    await expect(
      channelService.listChannelPermissions(fastify, CHANNEL_ID, ORG_ID, ['Admin'])
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── getChannel ───────────────────────────────────────────────────────────────

describe('channelService.getChannel', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns channel with messageCount instead of _count', async () => {
    const { fastify, prisma } = buildMockFastify()
    const channelWithCount = {
      ...baseChannel,
      permissions: basePermissions,
      members: [],
      _count: { messages: 5 },
    }
    prisma.channel.findFirst.mockResolvedValue(channelWithCount)
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
    ])

    const result = await channelService.getChannel(fastify, CHANNEL_ID, ORG_ID, ['Admin'])

    expect(result).toHaveProperty('messageCount', 5)
    expect(result).not.toHaveProperty('_count')
  })

  it('throws ForbiddenError when user cannot read the channel', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue({
      ...baseChannel,
      permissions: [],
      members: [],
      _count: { messages: 0 },
    })
    // No permissions for FieldUser
    prisma.channelPermission.findMany.mockResolvedValue([])

    await expect(
      channelService.getChannel(fastify, CHANNEL_ID, ORG_ID, ['FieldUser'])
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when channel does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(null)

    await expect(
      channelService.getChannel(fastify, CHANNEL_ID, ORG_ID, ['Admin'])
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── sendMessage ──────────────────────────────────────────────────────────────

describe('channelService.sendMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows sending when user has canWrite permission', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'Foreman', canRead: true, canWrite: true, canManage: false },
    ])
    prisma.chatMessage.create.mockResolvedValue(baseMessage)

    const result = await channelService.sendMessage(
      fastify,
      CHANNEL_ID,
      ORG_ID,
      USER_ID,
      ['Foreman'],
      { body: 'Hello world' }
    )

    expect(result.body).toBe('Hello world')
    expect(prisma.chatMessage.create).toHaveBeenCalledOnce()
  })

  it('throws ForbiddenError when user lacks canWrite permission', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
    ])

    await expect(
      channelService.sendMessage(fastify, CHANNEL_ID, ORG_ID, USER_ID, ['FieldUser'], {
        body: 'Hello world',
      })
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when channel does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.channel.findFirst.mockResolvedValue(null)

    await expect(
      channelService.sendMessage(fastify, CHANNEL_ID, ORG_ID, USER_ID, ['Admin'], {
        body: 'Hello',
      })
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── editMessage ──────────────────────────────────────────────────────────────

describe('channelService.editMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows sender to edit their own message', async () => {
    const { fastify, prisma } = buildMockFastify()
    const updatedMessage = { ...baseMessage, body: 'Updated', editedAt: new Date() }
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)
    prisma.chatMessage.update.mockResolvedValue({
      ...updatedMessage,
      _count: { replies: 0 },
    })

    const result = await channelService.editMessage(
      fastify,
      MESSAGE_ID,
      CHANNEL_ID,
      ORG_ID,
      USER_ID,
      'Updated'
    )

    expect(result.body).toBe('Updated')
  })

  it('throws ForbiddenError when a different user tries to edit', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage) // senderId = USER_ID

    await expect(
      channelService.editMessage(
        fastify,
        MESSAGE_ID,
        CHANNEL_ID,
        ORG_ID,
        'other-user',
        'Hacked'
      )
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError when message is already deleted', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue({
      ...baseMessage,
      deletedAt: new Date(),
    })

    await expect(
      channelService.editMessage(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, 'Edit')
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError when message does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(null)

    await expect(
      channelService.editMessage(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, 'Edit')
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── deleteMessage ────────────────────────────────────────────────────────────

describe('channelService.deleteMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows sender to soft-delete their own message', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)
    prisma.channelPermission.findMany.mockResolvedValue([])
    prisma.chatMessage.update.mockResolvedValue({ ...baseMessage, deletedAt: new Date() })

    await channelService.deleteMessage(
      fastify,
      MESSAGE_ID,
      CHANNEL_ID,
      ORG_ID,
      USER_ID,
      ['FieldUser']
    )

    expect(prisma.chatMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MESSAGE_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    )
  })

  it('allows admin to delete another user message', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue({ ...baseMessage, senderId: 'other-user' })
    prisma.channelPermission.findMany.mockResolvedValue([])
    prisma.chatMessage.update.mockResolvedValue({ ...baseMessage, deletedAt: new Date() })

    await expect(
      channelService.deleteMessage(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, ['Admin'])
    ).resolves.not.toThrow()
  })

  it('throws ForbiddenError when user is not sender and not admin', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue({ ...baseMessage, senderId: 'other-user' })
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
    ])

    await expect(
      channelService.deleteMessage(
        fastify,
        MESSAGE_ID,
        CHANNEL_ID,
        ORG_ID,
        USER_ID,
        ['FieldUser']
      )
    ).rejects.toThrow(ForbiddenError)
  })
})

// ─── confirmAttachment ────────────────────────────────────────────────────────

describe('channelService.confirmAttachment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects mismatched MIME type', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)

    await expect(
      channelService.confirmAttachment(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, {
        filename: 'evil.exe',
        mimeType: 'application/x-executable',
        sizeBytes: 1024,
        storageKey: `attachments/${ORG_ID}/${CHANNEL_ID}/uuid/evil.exe`,
      })
    ).rejects.toThrow(ValidationError)
  })

  it('rejects invalid storage key prefix', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)

    await expect(
      channelService.confirmAttachment(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, {
        filename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageKey: 'attachments/other-org/other-chan/uuid/doc.pdf',
      })
    ).rejects.toThrow(ValidationError)
  })

  it('rejects path traversal attempts in storage key', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)

    await expect(
      channelService.confirmAttachment(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, {
        filename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageKey: `attachments/${ORG_ID}/${CHANNEL_ID}/../../../secret/doc.pdf`,
      })
    ).rejects.toThrow(ValidationError)
  })

  it('rejects file sizes above the maximum', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)

    await expect(
      channelService.confirmAttachment(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, USER_ID, {
        filename: 'huge.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 999_999_999,
        storageKey: `attachments/${ORG_ID}/${CHANNEL_ID}/uuid/huge.pdf`,
      })
    ).rejects.toThrow(ValidationError)
  })

  it('throws ForbiddenError when a different user tries to confirm', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage) // senderId = USER_ID

    await expect(
      channelService.confirmAttachment(fastify, MESSAGE_ID, CHANNEL_ID, ORG_ID, 'other-user', {
        filename: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageKey: `attachments/${ORG_ID}/${CHANNEL_ID}/uuid/doc.pdf`,
      })
    ).rejects.toThrow(ForbiddenError)
  })
})
