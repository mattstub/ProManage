import rateLimit from '@fastify/rate-limit'

import { UnauthorizedError } from '../../lib/errors'
import { authenticate } from '../../middleware/authenticate'
import { noContent, paginated, success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as notificationService from '../../services/notification.service'

import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Auth preHandler for SSE endpoint.
 * Reads Bearer token from query param since EventSource cannot set headers.
 */
async function authenticateSSE(request: FastifyRequest, _reply: FastifyReply) {
  const { token } = request.query as { token?: string }
  if (!token) {
    throw new UnauthorizedError('Token required')
  }
  try {
    const payload = await request.server.jwt.verify<{
      sub: string
      email: string
      organizationId: string
    }>(token)
    request.user = {
      id: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, { global: false })

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /notifications - List own notifications (paginated)
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        unreadOnly?: string
      }
      const { notifications, meta } = await notificationService.listNotifications(
        fastify,
        request.user.id,
        query
      )
      return paginated(reply, notifications, meta)
    }
  )

  // GET /notifications/unread-count - Get unread count (for polling fallback)
  fastify.get(
    '/unread-count',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const count = await notificationService.getUnreadCount(fastify, request.user.id)
      return success(reply, { count })
    }
  )

  // GET /notifications/stream - SSE endpoint (token in query param)
  fastify.get(
    '/stream',
    { preHandler: [authenticateSSE] },
    (request, reply) => {
      reply.hijack()

      const res = reply.raw
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      res.write(':\n\n') // Initial keepalive comment

      const userId = request.user.id

      if (!fastify.sseClients.has(userId)) {
        fastify.sseClients.set(userId, new Set())
      }
      fastify.sseClients.get(userId)!.add(res)

      // Heartbeat every 30s to keep the connection alive through proxies
      const heartbeat = setInterval(() => {
        if (!res.writableEnded) {
          res.write(':\n\n')
        }
      }, 30000)

      request.raw.on('close', () => {
        clearInterval(heartbeat)
        const clients = fastify.sseClients.get(userId)
        if (clients) {
          clients.delete(res)
          if (clients.size === 0) {
            fastify.sseClients.delete(userId)
          }
        }
      })
    }
  )

  // PATCH /notifications/:id/read - Mark single notification as read
  fastify.patch(
    '/:id/read',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const notification = await notificationService.markRead(fastify, id, request.user.id)
      return success(reply, notification)
    }
  )

  // PATCH /notifications/read-all - Mark all notifications as read
  fastify.patch(
    '/read-all',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const count = await notificationService.markAllRead(fastify, request.user.id)
      return success(reply, { count })
    }
  )

  // DELETE /notifications/:id - Delete own notification
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await notificationService.deleteNotification(fastify, id, request.user.id)
      return noContent(reply)
    }
  )
}

export default notificationRoutes
