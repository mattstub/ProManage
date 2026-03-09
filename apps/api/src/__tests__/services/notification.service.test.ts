import { describe, it, expect } from 'vitest'

import {
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markRead,
} from '../../services/notification.service'
import { createMockPrisma } from '../helpers/mock-prisma'

const USER_ID = 'user-1'
const ORG_ID = 'org-1'
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

// Minimal mock fastify with no-op SSE clients
function buildFastify(prisma: ReturnType<typeof createMockPrisma>) {
  return {
    prisma,
    sseClients: new Map(),
  } as unknown as Parameters<typeof listNotifications>[0]
}

describe('listNotifications', () => {
  it('returns notifications and pagination meta', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findMany.mockResolvedValue([mockNotification])
    prisma.notification.count.mockResolvedValue(1)

    const fastify = buildFastify(prisma)
    const result = await listNotifications(fastify, USER_ID, {})

    expect(result.notifications).toHaveLength(1)
    expect(result.meta.total).toBe(1)
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    )
  })

  it('filters by unread when unreadOnly is true', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findMany.mockResolvedValue([mockNotification])
    prisma.notification.count.mockResolvedValue(1)

    const fastify = buildFastify(prisma)
    await listNotifications(fastify, USER_ID, { unreadOnly: 'true' })

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, read: false } })
    )
  })
})

describe('getUnreadCount', () => {
  it('returns the count of unread notifications', async () => {
    const prisma = createMockPrisma()
    prisma.notification.count.mockResolvedValue(3)

    const fastify = buildFastify(prisma)
    const count = await getUnreadCount(fastify, USER_ID)

    expect(count).toBe(3)
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
    })
  })
})

describe('markRead', () => {
  it('marks notification as read for the owner', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: USER_ID })
    prisma.notification.update.mockResolvedValue({ ...mockNotification, read: true })

    const fastify = buildFastify(prisma)
    const result = await markRead(fastify, NOTIF_ID, USER_ID)

    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { read: true } })
    )
    expect(result.read).toBe(true)
  })

  it('throws NotFoundError for unknown notification', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue(null)

    const fastify = buildFastify(prisma)
    await expect(markRead(fastify, 'bad-id', USER_ID)).rejects.toMatchObject({
      message: 'Notification not found',
    })
  })

  it('throws ForbiddenError when another user tries to mark read', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: 'other-user' })

    const fastify = buildFastify(prisma)
    await expect(markRead(fastify, NOTIF_ID, USER_ID)).rejects.toMatchObject({
      message: "Cannot modify another user's notification",
    })
  })
})

describe('markAllRead', () => {
  it('marks all unread notifications as read and returns count', async () => {
    const prisma = createMockPrisma()
    prisma.notification.updateMany.mockResolvedValue({ count: 5 })

    const fastify = buildFastify(prisma)
    const count = await markAllRead(fastify, USER_ID)

    expect(count).toBe(5)
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
      data: { read: true },
    })
  })
})

describe('deleteNotification', () => {
  it('deletes notification for the owner', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: USER_ID })
    prisma.notification.delete.mockResolvedValue(mockNotification)

    const fastify = buildFastify(prisma)
    await deleteNotification(fastify, NOTIF_ID, USER_ID)

    expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: NOTIF_ID } })
  })

  it('throws NotFoundError for unknown notification', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue(null)

    const fastify = buildFastify(prisma)
    await expect(deleteNotification(fastify, 'bad-id', USER_ID)).rejects.toMatchObject({
      message: 'Notification not found',
    })
  })

  it('throws ForbiddenError when another user tries to delete', async () => {
    const prisma = createMockPrisma()
    prisma.notification.findFirst.mockResolvedValue({ id: NOTIF_ID, userId: 'other-user' })

    const fastify = buildFastify(prisma)
    await expect(deleteNotification(fastify, NOTIF_ID, USER_ID)).rejects.toMatchObject({
      message: "Cannot delete another user's notification",
    })
  })
})

describe('createNotification', () => {
  it('creates and returns a notification', async () => {
    const prisma = createMockPrisma()
    prisma.notification.create.mockResolvedValue(mockNotification)

    const fastify = buildFastify(prisma)
    const result = await createNotification(fastify, {
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'Task Assigned',
      message: 'You have been assigned to "Install HVAC"',
      type: 'TASK_ASSIGNED',
      entityId: 'task-1',
      entityType: 'task',
    })

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          organizationId: ORG_ID,
          type: 'TASK_ASSIGNED',
        }),
      })
    )
    expect(result.title).toBe('Task Assigned')
  })

  it('defaults type to INFO when not specified', async () => {
    const prisma = createMockPrisma()
    prisma.notification.create.mockResolvedValue({ ...mockNotification, type: 'INFO' })

    const fastify = buildFastify(prisma)
    await createNotification(fastify, {
      userId: USER_ID,
      organizationId: ORG_ID,
      title: 'Info',
      message: 'Some info',
    })

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'INFO' }),
      })
    )
  })
})
