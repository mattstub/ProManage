import { describe, it, expect, vi, beforeEach } from 'vitest'

import { buildMessagingTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_A = 'user-aaa'
const USER_B = 'user-bbb'

const baseConversation = {
  id: 'conv-1',
  organizationId: ORG_ID,
  participantAId: USER_A,
  participantBId: USER_B,
  lastMessageAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  participantA: { id: USER_A, firstName: 'Alice', lastName: 'Admin', email: 'alice@demo.com', avatarUrl: null },
  participantB: { id: USER_B, firstName: 'Bob', lastName: 'Builder', email: 'bob@demo.com', avatarUrl: null },
  messages: [],
}

const baseMessage = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: USER_A,
  body: 'Hello Bob!',
  readAt: null,
  createdAt: new Date().toISOString(),
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
  sentAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: { id: USER_A, firstName: 'Alice', lastName: 'Admin', avatarUrl: null },
}

// ─── GET /messages/conversations ──────────────────────────────────────────────

describe('GET /api/v1/messages/conversations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with conversation list when authenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.conversation.findMany.mockResolvedValue([{ ...baseConversation, messages: [baseMessage] }])
    prisma.conversation.count.mockResolvedValue(1)
    prisma.directMessage.count.mockResolvedValue(0)

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/conversations',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta.total).toBe(1)

    await app.close()
  })

  it('returns 401 without token', async () => {
    const { app } = await buildMessagingTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/messages/conversations' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })
})

// ─── POST /messages/conversations/:userId ─────────────────────────────────────

describe('POST /api/v1/messages/conversations/:userId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with conversation and first message', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.user.findFirst.mockResolvedValue(baseConversation.participantB)
    prisma.conversation.upsert.mockResolvedValue(baseConversation)
    prisma.conversation.findFirst.mockResolvedValue(baseConversation)
    prisma.$transaction.mockResolvedValue([baseMessage, baseConversation])

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${USER_B}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { body: 'Hello Bob!' },
    })

    expect(res.statusCode).toBe(201)
    const data = res.json().data
    expect(data.conversation.id).toBe('conv-1')
    expect(data.message.body).toBe('Hello Bob!')

    await app.close()
  })

  it('returns 400 for empty message body', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/conversations/${USER_B}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { body: '' },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })
})

// ─── POST /messages/conversations/:id/messages ────────────────────────────────

describe('POST /api/v1/messages/conversations/:id/messages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 when sending a message in existing conversation', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.conversation.findFirst.mockResolvedValue(baseConversation)
    prisma.$transaction.mockResolvedValue([baseMessage, baseConversation])

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/conversations/conv-1/messages',
      headers: { authorization: `Bearer ${token}` },
      payload: { body: 'Hello Bob!' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.body).toBe('Hello Bob!')

    await app.close()
  })
})

// ─── GET /messages/announcements ─────────────────────────────────────────────

describe('GET /api/v1/messages/announcements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with announcements list', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])
    prisma.announcement.findMany.mockResolvedValue([{ ...baseAnnouncement, reads: [] }])
    prisma.announcement.count.mockResolvedValue(1)

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/announcements',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].subject).toBe('Safety Meeting')
    expect(body.data[0].isRead).toBe(false)

    await app.close()
  })
})

// ─── POST /messages/announcements ────────────────────────────────────────────

describe('POST /api/v1/messages/announcements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 when Admin creates an announcement', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin', organizationId: ORG_ID } }])
    prisma.announcement.create.mockResolvedValue(baseAnnouncement)

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/announcements',
      headers: { authorization: `Bearer ${token}` },
      payload: { subject: 'Safety Meeting', body: 'Mandatory safety meeting this Friday.' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.subject).toBe('Safety Meeting')

    await app.close()
  })

  it('returns 403 when FieldUser tries to create announcement', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser', organizationId: ORG_ID } }])

    const token = signTestToken(app, { sub: USER_B, email: 'bob@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/announcements',
      headers: { authorization: `Bearer ${token}` },
      payload: { subject: 'Nope', body: 'Should not work.' },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 400 for missing required fields', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin', organizationId: ORG_ID } }])

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/announcements',
      headers: { authorization: `Bearer ${token}` },
      payload: { subject: '' },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })
})

// ─── POST /messages/announcements/:id/read ────────────────────────────────────

describe('POST /api/v1/messages/announcements/:id/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when marking announcement as read', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.announcement.findFirst.mockResolvedValue(baseAnnouncement)
    prisma.announcementRead.upsert.mockResolvedValue({ announcementId: 'ann-1', userId: USER_A, readAt: new Date() })

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/messages/announcements/ann-1/read',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)

    await app.close()
  })
})

// ─── GET /messages/unread-count ───────────────────────────────────────────────

describe('GET /api/v1/messages/unread-count', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with unread counts', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildMessagingTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.directMessage.count.mockResolvedValue(4)
    prisma.announcement.count.mockResolvedValue(1)

    const token = signTestToken(app, { sub: USER_A, email: 'alice@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/messages/unread-count',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const data = res.json().data
    expect(data.directMessages).toBe(4)
    expect(data.announcements).toBe(1)
    expect(data.total).toBe(5)

    await app.close()
  })
})
