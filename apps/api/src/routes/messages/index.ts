import rateLimit from '@fastify/rate-limit'

import { createAnnouncementSchema, sendDirectMessageSchema, updateAnnouncementSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { created, noContent, paginated, success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as messagingService from '../../services/messaging.service'

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

async function getUserRoles(fastify: FastifyInstance, userId: string, organizationId: string) {
  const userRoles = await fastify.prisma.userRole.findMany({
    where: { userId, role: { organizationId } },
    include: { role: true },
  })
  return userRoles.map((ur) => ur.role.name)
}

const messageRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, { global: false })

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Unread Count ───────────────────────────────────────────────────────────

  // GET /messages/unread-count
  fastify.get(
    '/unread-count',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const counts = await messagingService.getUnreadCount(fastify, organizationId, userId, userRoles)
      return success(reply, counts)
    }
  )

  // ─── Direct Messages ────────────────────────────────────────────────────────

  // GET /messages/conversations - List conversations for current user
  fastify.get(
    '/conversations',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as { page?: string; perPage?: string }
      const { conversations, meta } = await messagingService.listConversations(
        fastify,
        request.user.organizationId,
        request.user.id,
        query
      )
      return paginated(reply, conversations, meta)
    }
  )

  // POST /messages/conversations/:userId - Get or create conversation with a user, send first message
  fastify.post(
    '/conversations/:userId',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { userId: otherUserId } = request.params as { userId: string }
      const input = sendDirectMessageSchema.parse(request.body)
      const { id: currentUserId, organizationId } = request.user

      const conversation = await messagingService.getOrCreateConversation(
        fastify,
        organizationId,
        currentUserId,
        otherUserId
      )

      const message = await messagingService.sendDirectMessage(
        fastify,
        organizationId,
        conversation.id,
        currentUserId,
        input
      )

      return created(reply, { conversation, message })
    }
  )

  // GET /messages/conversations/:conversationId/messages - List messages in a thread
  fastify.get(
    '/conversations/:conversationId/messages',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string }
      const query = request.query as { page?: string; perPage?: string }
      const { messages, meta } = await messagingService.getConversationMessages(
        fastify,
        request.user.organizationId,
        conversationId,
        request.user.id,
        query
      )
      return paginated(reply, messages, meta)
    }
  )

  // POST /messages/conversations/:conversationId/messages - Send a message in an existing thread
  fastify.post(
    '/conversations/:conversationId/messages',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { conversationId } = request.params as { conversationId: string }
      const input = sendDirectMessageSchema.parse(request.body)
      const message = await messagingService.sendDirectMessage(
        fastify,
        request.user.organizationId,
        conversationId,
        request.user.id,
        input
      )
      return created(reply, message)
    }
  )

  // ─── Announcements ──────────────────────────────────────────────────────────

  // GET /messages/announcements - List sent announcements visible to current user
  fastify.get(
    '/announcements',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as { page?: string; perPage?: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const { announcements, meta } = await messagingService.listAnnouncements(
        fastify,
        organizationId,
        userId,
        userRoles,
        query
      )
      return paginated(reply, announcements, meta)
    }
  )

  // GET /messages/announcements/drafts - List draft/scheduled announcements (managers only)
  fastify.get(
    '/announcements/drafts',
    {
      preHandler: [
        readRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const announcements = await messagingService.listDraftAnnouncements(
        fastify,
        request.user.organizationId,
        request.user.id
      )
      return success(reply, announcements)
    }
  )

  // GET /messages/announcements/:id - Get single announcement
  fastify.get(
    '/announcements/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const announcement = await messagingService.getAnnouncement(
        fastify,
        id,
        organizationId,
        userId,
        userRoles
      )
      return success(reply, announcement)
    }
  )

  // POST /messages/announcements - Create announcement (Admin, ProjectManager, OfficeAdmin)
  fastify.post(
    '/announcements',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const input = createAnnouncementSchema.parse(request.body)
      const announcement = await messagingService.createAnnouncement(
        fastify,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, announcement)
    }
  )

  // PATCH /messages/announcements/:id - Update draft/scheduled announcement
  fastify.patch(
    '/announcements/:id',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateAnnouncementSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const announcement = await messagingService.updateAnnouncement(
        fastify,
        id,
        organizationId,
        userId,
        userRoles,
        input
      )
      return success(reply, announcement)
    }
  )

  // DELETE /messages/announcements/:id - Delete draft announcement
  fastify.delete(
    '/announcements/:id',
    {
      preHandler: [
        sensitiveRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      await messagingService.deleteAnnouncement(fastify, id, organizationId, userId, userRoles)
      return noContent(reply)
    }
  )

  // POST /messages/announcements/:id/read - Mark announcement as read
  fastify.post(
    '/announcements/:id/read',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await messagingService.markAnnouncementRead(
        fastify,
        id,
        request.user.organizationId,
        request.user.id
      )
      return noContent(reply)
    }
  )
}

export default messageRoutes
