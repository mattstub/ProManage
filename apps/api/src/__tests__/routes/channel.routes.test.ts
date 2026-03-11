import { describe, it, expect, vi, beforeEach } from 'vitest'

import { buildChannelTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

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
  permissions: [
    { channelId: CHANNEL_ID, roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
  ],
  _count: { messages: 2 },
  members: [],
}

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

const basePermission = {
  channelId: CHANNEL_ID,
  roleName: 'Admin',
  canRead: true,
  canWrite: true,
  canManage: true,
}

// ─── GET /channels ─────────────────────────────────────────────────────────────

describe('GET /api/v1/channels', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with list of channels when authenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([])
    prisma.channel.findMany.mockResolvedValue([{ ...baseChannel, permissions: [] }])

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/channels',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildChannelTestApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/channels' })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

// ─── GET /channels/:channelId ──────────────────────────────────────────────────

describe('GET /api/v1/channels/:channelId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 and channel data with messageCount, not _count', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    // getChannelPermissionForUser uses channelPermission.findMany
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
    ])

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${CHANNEL_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('messageCount')
    expect(body.data).not.toHaveProperty('_count')

    await app.close()
  })

  it('returns 404 when channel does not exist', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.channel.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${CHANNEL_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)

    await app.close()
  })
})

// ─── GET /channels/:channelId/permissions ──────────────────────────────────────

describe('GET /api/v1/channels/:channelId/permissions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with permissions for an admin user', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    prisma.channelPermission.findMany
      .mockResolvedValueOnce([
        { channelId: CHANNEL_ID, roleName: 'Admin', canRead: true, canWrite: true, canManage: true },
      ]) // getChannelPermissionForUser
      .mockResolvedValueOnce([basePermission]) // final result

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${CHANNEL_ID}/permissions`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)

    await app.close()
  })

  it('returns 403 when user cannot read the channel', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    // FieldUser with no permissions
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    prisma.channel.findFirst.mockResolvedValue(baseChannel)
    prisma.channelPermission.findMany.mockResolvedValue([])

    const token = signTestToken(app, { sub: USER_ID, email: 'field@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${CHANNEL_ID}/permissions`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildChannelTestApp()

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/channels/${CHANNEL_ID}/permissions`,
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

// ─── PATCH /channels/:channelId/messages/:messageId ────────────────────────────

describe('PATCH /api/v1/channels/:channelId/messages/:messageId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 when sender edits their own message with valid body', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)
    prisma.chatMessage.update.mockResolvedValue({ ...baseMessage, body: 'Updated', editedAt: new Date(), _count: { replies: 0 } })

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'Updated' }),
    })

    expect(res.statusCode).toBe(200)

    await app.close()
  })

  it('returns 400 when body is empty (Zod validation)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body: '' }),
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 400 when body exceeds max length (Zod validation)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, { sub: USER_ID, email: 'admin@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'a'.repeat(5001) }),
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 403 when a different user tries to edit', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage) // senderId = USER_ID

    const token = signTestToken(app, {
      sub: 'other-user',
      email: 'other@demo.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'Hacked' }),
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildChannelTestApp()

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'Updated' }),
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

// ─── DELETE /channels/:channelId/messages/:messageId ──────────────────────────

describe('DELETE /api/v1/channels/:channelId/messages/:messageId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when sender deletes their own message', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    prisma.chatMessage.findFirst.mockResolvedValue(baseMessage)
    prisma.channelPermission.findMany.mockResolvedValue([])
    prisma.chatMessage.update.mockResolvedValue({ ...baseMessage, deletedAt: new Date() })

    const token = signTestToken(app, { sub: USER_ID, email: 'field@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)

    await app.close()
  })

  it('returns 403 when another user tries to delete without manage permission', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildChannelTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    prisma.chatMessage.findFirst.mockResolvedValue({ ...baseMessage, senderId: 'other-user' })
    prisma.channelPermission.findMany.mockResolvedValue([
      { channelId: CHANNEL_ID, roleName: 'FieldUser', canRead: true, canWrite: false, canManage: false },
    ])

    const token = signTestToken(app, { sub: USER_ID, email: 'field@demo.com', organizationId: ORG_ID })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/channels/${CHANNEL_ID}/messages/${MESSAGE_ID}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })
})
