import { describe, it, expect } from 'vitest'

import { buildNotificationTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const NOTIF_ID = 'notif-1'

const mockNotification = {
  id: NOTIF_ID,
  title: 'Task Assigned',
  message: 'You have been assigned to "Install HVAC"',
  type: 'TASK_ASSIGNED',
  read: false,
  entityId: 'task-1',
  entityType: 'task',
  userId: USER_ID,
  organizationId: ORG_ID,
  createdAt: new Date(),
}

describe('GET /api/v1/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildNotificationTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/notifications' })
    expect(res.statusCode).toBe(401)
  })

  it('returns paginated notifications for authenticated user', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findMany.mockResolvedValue([mockNotification])
    prisma.notification.count.mockResolvedValue(1)

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Task Assigned')
    expect(body.meta).toBeDefined()
  })

  it('supports unreadOnly filter', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findMany.mockResolvedValue([mockNotification])
    prisma.notification.count.mockResolvedValue(1)

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications?unreadOnly=true',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, read: false } })
    )
  })
})

describe('GET /api/v1/notifications/unread-count', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildNotificationTestApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns unread count for authenticated user', async () => {
    const prisma = createMockPrisma()
    prisma.notification.count.mockResolvedValue(4)

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.count).toBe(4)
  })
})

describe('PATCH /api/v1/notifications/:id/read', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildNotificationTestApp()
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/notifications/${NOTIF_ID}/read`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('marks notification as read for owner', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: USER_ID })
    prisma.notification.update.mockResolvedValue({ ...mockNotification, read: true })

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/notifications/${NOTIF_ID}/read`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.read).toBe(true)
  })

  it('returns 403 when another user tries to mark read', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: 'other-user' })

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/notifications/${NOTIF_ID}/read`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('PATCH /api/v1/notifications/read-all', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildNotificationTestApp()
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/notifications/read-all',
    })
    expect(res.statusCode).toBe(401)
  })

  it('marks all notifications as read', async () => {
    const prisma = createMockPrisma()
    prisma.notification.updateMany.mockResolvedValue({ count: 3 })

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/notifications/read-all',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.count).toBe(3)
  })
})

describe('DELETE /api/v1/notifications/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildNotificationTestApp()
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/notifications/${NOTIF_ID}`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('deletes own notification', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: USER_ID })
    prisma.notification.delete.mockResolvedValue(mockNotification)

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/notifications/${NOTIF_ID}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 403 when deleting another user\'s notification', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: 'other-user' })

    const { app } = await buildNotificationTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'user@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/notifications/${NOTIF_ID}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })
})
