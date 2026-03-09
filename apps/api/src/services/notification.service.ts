import { emitToUser } from '../lib/sse'
import { ForbiddenError, NotFoundError } from '../lib/errors'
import { buildPaginationMeta, parsePagination } from '@promanage/core'

import type { CreateNotificationInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const NOTIFICATION_SELECT = {
  id: true,
  title: true,
  message: true,
  type: true,
  read: true,
  entityId: true,
  entityType: true,
  userId: true,
  organizationId: true,
  createdAt: true,
}

export interface ListNotificationsQuery {
  page?: string
  perPage?: string
  unreadOnly?: string
}

export async function listNotifications(
  fastify: FastifyInstance,
  userId: string,
  query: ListNotificationsQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)
  const where = {
    userId,
    ...(query.unreadOnly === 'true' ? { read: false } : {}),
  }

  const [notifications, total] = await Promise.all([
    fastify.prisma.notification.findMany({
      where,
      select: NOTIFICATION_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    fastify.prisma.notification.count({ where }),
  ])

  return { notifications, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getUnreadCount(
  fastify: FastifyInstance,
  userId: string
): Promise<number> {
  return fastify.prisma.notification.count({ where: { userId, read: false } })
}

export async function markRead(
  fastify: FastifyInstance,
  notificationId: string,
  userId: string
) {
  const notification = await fastify.prisma.notification.findFirst({
    where: { id: notificationId },
    select: { id: true, userId: true },
  })

  if (!notification) {
    throw new NotFoundError('Notification not found')
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Cannot modify another user\'s notification')
  }

  return fastify.prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: NOTIFICATION_SELECT,
  })
}

export async function markAllRead(
  fastify: FastifyInstance,
  userId: string
): Promise<number> {
  const result = await fastify.prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  return result.count
}

export async function deleteNotification(
  fastify: FastifyInstance,
  notificationId: string,
  userId: string
) {
  const notification = await fastify.prisma.notification.findFirst({
    where: { id: notificationId },
    select: { id: true, userId: true },
  })

  if (!notification) {
    throw new NotFoundError('Notification not found')
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('Cannot delete another user\'s notification')
  }

  await fastify.prisma.notification.delete({ where: { id: notificationId } })
}

export async function createNotification(
  fastify: FastifyInstance,
  input: CreateNotificationInput
) {
  const notification = await fastify.prisma.notification.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type ?? 'INFO',
      entityId: input.entityId,
      entityType: input.entityType,
      userId: input.userId,
      organizationId: input.organizationId,
    },
    select: NOTIFICATION_SELECT,
  })

  // Push to connected SSE clients (best-effort)
  emitToUser(fastify, input.userId, 'notification', notification)

  return notification
}
