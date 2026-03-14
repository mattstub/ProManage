import { describe, it, expect, vi, beforeEach } from 'vitest'


import { ForbiddenError, NotFoundError } from '../../lib/errors'
import * as messagingService from '../../services/messaging.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { FastifyInstance } from 'fastify'

function buildMockFastify() {
  const prisma = createMockPrisma()
  return {
    fastify: { prisma } as unknown as FastifyInstance,
    prisma,
  }
}

const ORG_ID = 'org-1'
const USER_A = 'user-aaa'
const USER_B = 'user-bbb'

// USER_A < USER_B lexicographically — participantA = USER_A, participantB = USER_B

const baseConversation = {
  id: 'conv-1',
  organizationId: ORG_ID,
  participantAId: USER_A,
  participantBId: USER_B,
  lastMessageAt: new Date(),
  createdAt: new Date(),
  participantA: { id: USER_A, firstName: 'Alice', lastName: 'Admin', email: 'alice@demo.com', avatarUrl: null },
  participantB: { id: USER_B, firstName: 'Bob', lastName: 'Builder', email: 'bob@demo.com', avatarUrl: null },
}

const baseMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: USER_A,
  body: 'Hello Bob!',
  readAt: null,
  createdAt: new Date(),
  sender: { id: USER_A, firstName: 'Alice', lastName: 'Admin', avatarUrl: null },
}

const baseAnnouncement = {
  id: 'ann-1',
  organizationId: ORG_ID,
  authorId: USER_A,
  subject: 'Safety Meeting',
  body: 'Mandatory safety meeting this Friday.',
  targetRole: null,
  scheduledAt: null,
  sentAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { id: USER_A, firstName: 'Alice', lastName: 'Admin', avatarUrl: null },
}

// ─── listConversations ────────────────────────────────────────────────────────

describe('messagingService.listConversations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns conversations for the current user', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.conversation.findMany.mockResolvedValue([{ ...baseConversation, messages: [baseMessage] }])
    prisma.conversation.count.mockResolvedValue(1)
    prisma.directMessage.count.mockResolvedValue(2)

    const result = await messagingService.listConversations(fastify, ORG_ID, USER_A, {})

    expect(result.conversations).toHaveLength(1)
    expect(result.conversations[0].unreadCount).toBe(2)
    expect(result.meta.total).toBe(1)
  })

  it('queries with OR for both participant positions', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.conversation.findMany.mockResolvedValue([])
    prisma.conversation.count.mockResolvedValue(0)

    await messagingService.listConversations(fastify, ORG_ID, USER_A, {})

    expect(prisma.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: ORG_ID,
          OR: [{ participantAId: USER_A }, { participantBId: USER_A }],
        },
      })
    )
  })
})

// ─── getOrCreateConversation ──────────────────────────────────────────────────

describe('messagingService.getOrCreateConversation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates conversation with canonical participant ordering (A < B)', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findFirst.mockResolvedValue(baseConversation.participantB)
    prisma.conversation.upsert.mockResolvedValue(baseConversation)

    await messagingService.getOrCreateConversation(fastify, ORG_ID, USER_A, USER_B)

    expect(prisma.conversation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_participantAId_participantBId: {
            organizationId: ORG_ID,
            participantAId: USER_A, // USER_A < USER_B
            participantBId: USER_B,
          },
        },
      })
    )
  })

  it('reverses ordering when initiating user has larger id', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findFirst.mockResolvedValue(baseConversation.participantA)
    prisma.conversation.upsert.mockResolvedValue(baseConversation)

    // USER_B initiates — but USER_A < USER_B, so A must remain participantA
    await messagingService.getOrCreateConversation(fastify, ORG_ID, USER_B, USER_A)

    expect(prisma.conversation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_participantAId_participantBId: {
            organizationId: ORG_ID,
            participantAId: USER_A,
            participantBId: USER_B,
          },
        },
      })
    )
  })

  it('throws NotFoundError when recipient does not exist in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findFirst.mockResolvedValue(null)

    await expect(
      messagingService.getOrCreateConversation(fastify, ORG_ID, USER_A, 'ghost-user')
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── sendDirectMessage ────────────────────────────────────────────────────────

describe('messagingService.sendDirectMessage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates message and updates conversation lastMessageAt', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.conversation.findFirst.mockResolvedValue(baseConversation)
    prisma.$transaction.mockResolvedValue([baseMessage, baseConversation])

    const result = await messagingService.sendDirectMessage(
      fastify,
      ORG_ID,
      'conv-1',
      USER_A,
      { body: 'Hello Bob!' }
    )

    expect(result).toEqual(baseMessage)
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('throws NotFoundError if conversation not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.conversation.findFirst.mockResolvedValue(null)

    await expect(
      messagingService.sendDirectMessage(fastify, ORG_ID, 'bad-conv', USER_A, { body: 'Hi' })
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects if sender is not a participant', async () => {
    const { fastify, prisma } = buildMockFastify()
    // conversation exists but findFirst returns null because OR filter excludes stranger
    prisma.conversation.findFirst.mockResolvedValue(null)

    await expect(
      messagingService.sendDirectMessage(fastify, ORG_ID, 'conv-1', 'stranger-id', { body: 'Hi' })
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── createAnnouncement ───────────────────────────────────────────────────────

describe('messagingService.createAnnouncement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets sentAt immediately when no scheduledAt', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.announcement.create.mockResolvedValue(baseAnnouncement)

    await messagingService.createAnnouncement(fastify, ORG_ID, USER_A, {
      subject: 'Safety Meeting',
      body: 'Mandatory safety meeting this Friday.',
    })

    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sentAt: expect.any(Date),
          scheduledAt: null,
        }),
      })
    )
  })

  it('sets sentAt to null when scheduledAt is provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    const scheduled = new Date('2026-04-01T09:00:00Z')
    prisma.announcement.create.mockResolvedValue({ ...baseAnnouncement, sentAt: null, scheduledAt: scheduled })

    await messagingService.createAnnouncement(fastify, ORG_ID, USER_A, {
      subject: 'Upcoming Event',
      body: 'Save the date.',
      scheduledAt: scheduled,
    })

    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sentAt: null,
          scheduledAt: scheduled,
        }),
      })
    )
  })

  it('stores targetRole when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.announcement.create.mockResolvedValue({ ...baseAnnouncement, targetRole: 'Foreman' })

    await messagingService.createAnnouncement(fastify, ORG_ID, USER_A, {
      subject: 'Foreman notice',
      body: 'For foremen only.',
      targetRole: 'Foreman',
    })

    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetRole: 'Foreman' }),
      })
    )
  })
})

// ─── updateAnnouncement ───────────────────────────────────────────────────────

describe('messagingService.updateAnnouncement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows author to edit draft', async () => {
    const { fastify, prisma } = buildMockFastify()
    const draft = { ...baseAnnouncement, sentAt: null }
    prisma.announcement.findFirst.mockResolvedValue(draft)
    prisma.announcement.update.mockResolvedValue({ ...draft, subject: 'Updated' })

    const result = await messagingService.updateAnnouncement(
      fastify, 'ann-1', ORG_ID, USER_A, ['Admin'], { subject: 'Updated' }
    )

    expect(result.subject).toBe('Updated')
  })

  it('throws ForbiddenError if announcement already sent', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.announcement.findFirst.mockResolvedValue(baseAnnouncement) // sentAt is set

    await expect(
      messagingService.updateAnnouncement(
        fastify, 'ann-1', ORG_ID, USER_A, ['Admin'], { subject: 'Too late' }
      )
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws ForbiddenError if non-author and non-admin tries to edit', async () => {
    const { fastify, prisma } = buildMockFastify()
    const draft = { ...baseAnnouncement, sentAt: null }
    prisma.announcement.findFirst.mockResolvedValue(draft)

    await expect(
      messagingService.updateAnnouncement(
        fastify, 'ann-1', ORG_ID, 'other-user', ['Foreman'], { subject: 'Hack' }
      )
    ).rejects.toThrow(ForbiddenError)
  })

  it('throws NotFoundError if announcement not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.announcement.findFirst.mockResolvedValue(null)

    await expect(
      messagingService.updateAnnouncement(
        fastify, 'ann-bad', ORG_ID, USER_A, ['Admin'], { subject: 'X' }
      )
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── deleteAnnouncement ───────────────────────────────────────────────────────

describe('messagingService.deleteAnnouncement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes a draft announcement', async () => {
    const { fastify, prisma } = buildMockFastify()
    const draft = { ...baseAnnouncement, sentAt: null }
    prisma.announcement.findFirst.mockResolvedValue(draft)
    prisma.announcement.delete.mockResolvedValue(draft)

    await messagingService.deleteAnnouncement(fastify, 'ann-1', ORG_ID, USER_A, ['Admin'])

    expect(prisma.announcement.delete).toHaveBeenCalledWith({ where: { id: 'ann-1' } })
  })

  it('throws ForbiddenError when trying to delete a sent announcement', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.announcement.findFirst.mockResolvedValue(baseAnnouncement) // sentAt set

    await expect(
      messagingService.deleteAnnouncement(fastify, 'ann-1', ORG_ID, USER_A, ['Admin'])
    ).rejects.toThrow(ForbiddenError)
  })
})

// ─── getUnreadCount ───────────────────────────────────────────────────────────

describe('messagingService.getUnreadCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns combined unread count', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.directMessage.count.mockResolvedValue(3)
    prisma.announcement.count.mockResolvedValue(2)

    const result = await messagingService.getUnreadCount(fastify, ORG_ID, USER_A, ['Admin'])

    expect(result.directMessages).toBe(3)
    expect(result.announcements).toBe(2)
    expect(result.total).toBe(5)
  })
})
