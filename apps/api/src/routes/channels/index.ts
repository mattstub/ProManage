import {
  createChannelSchema,
  updateChannelSchema,
  sendChatMessageSchema,
  editChatMessageSchema,
  updateChannelPermissionSchema,
} from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import * as channelService from '../../services/channel.service'

import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

async function getUserRoles(fastify: FastifyInstance, userId: string, organizationId: string) {
  const userRoles = await fastify.prisma.userRole.findMany({
    where: { userId, role: { organizationId } },
    include: { role: true },
  })
  return userRoles.map((ur) => ur.role.name)
}

const channelRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Channels ───────────────────────────────────────────────────────────────

  // GET /channels — list channels visible to current user
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const channels = await channelService.listChannels(fastify, organizationId, userRoles)
      return success(reply, channels)
    }
  )

  // POST /channels — create channel (Admin, ProjectManager, OfficeAdmin)
  fastify.post(
    '/',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const input = createChannelSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const channel = await channelService.createChannel(
        fastify,
        organizationId,
        userId,
        userRoles,
        input
      )
      return created(reply, channel)
    }
  )

  // GET /channels/:channelId
  fastify.get(
    '/:channelId',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const channel = await channelService.getChannel(fastify, channelId, organizationId, userRoles)
      return success(reply, channel)
    }
  )

  // PATCH /channels/:channelId
  fastify.patch(
    '/:channelId',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const input = updateChannelSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const channel = await channelService.updateChannel(
        fastify,
        channelId,
        organizationId,
        userRoles,
        input
      )
      return success(reply, channel)
    }
  )

  // DELETE /channels/:channelId
  fastify.delete(
    '/:channelId',
    {
      preHandler: [
        sensitiveRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      await channelService.deleteChannel(fastify, channelId, organizationId, userRoles)
      return noContent(reply)
    }
  )

  // ─── Permissions ────────────────────────────────────────────────────────────

  // GET /channels/:channelId/permissions
  fastify.get(
    '/:channelId/permissions',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const permissions = await channelService.listChannelPermissions(
        fastify,
        channelId,
        organizationId,
        userRoles
      )
      return success(reply, permissions)
    }
  )

  // PUT /channels/:channelId/permissions
  fastify.put(
    '/:channelId/permissions',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const input = updateChannelPermissionSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const permission = await channelService.updateChannelPermission(
        fastify,
        channelId,
        organizationId,
        userRoles,
        input
      )
      return success(reply, permission)
    }
  )

  // ─── Membership ─────────────────────────────────────────────────────────────

  // POST /channels/:channelId/join
  fastify.post(
    '/:channelId/join',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      await channelService.joinChannel(fastify, channelId, organizationId, userId, userRoles)
      return noContent(reply)
    }
  )

  // POST /channels/:channelId/leave
  fastify.post(
    '/:channelId/leave',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { id: userId, organizationId } = request.user
      await channelService.leaveChannel(fastify, channelId, organizationId, userId)
      return noContent(reply)
    }
  )

  // ─── Messages ───────────────────────────────────────────────────────────────

  // GET /channels/:channelId/messages
  fastify.get(
    '/:channelId/messages',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const query = request.query as { page?: string; perPage?: string; parentId?: string }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const { messages, meta } = await channelService.listMessages(
        fastify,
        channelId,
        organizationId,
        userRoles,
        query
      )
      return paginated(reply, messages, meta)
    }
  )

  // POST /channels/:channelId/messages
  fastify.post(
    '/:channelId/messages',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const input = sendChatMessageSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const message = await channelService.sendMessage(
        fastify,
        channelId,
        organizationId,
        userId,
        userRoles,
        input
      )
      return created(reply, message)
    }
  )

  // PATCH /channels/:channelId/messages/:messageId
  fastify.patch(
    '/:channelId/messages/:messageId',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId, messageId } = request.params as {
        channelId: string
        messageId: string
      }
      const { body } = editChatMessageSchema.parse(request.body)
      const { id: userId, organizationId } = request.user
      const message = await channelService.editMessage(
        fastify,
        messageId,
        channelId,
        organizationId,
        userId,
        body
      )
      return success(reply, message)
    }
  )

  // DELETE /channels/:channelId/messages/:messageId
  fastify.delete(
    '/:channelId/messages/:messageId',
    { preHandler: [sensitiveRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId, messageId } = request.params as {
        channelId: string
        messageId: string
      }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      await channelService.deleteMessage(
        fastify,
        messageId,
        channelId,
        organizationId,
        userId,
        userRoles
      )
      return noContent(reply)
    }
  )

  // ─── Attachments ─────────────────────────────────────────────────────────────

  // POST /channels/:channelId/attachments/upload-url
  fastify.post(
    '/:channelId/attachments/upload-url',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId } = request.params as { channelId: string }
      const { filename, mimeType, sizeBytes } = request.body as {
        filename: string
        mimeType: string
        sizeBytes: number
      }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const result = await channelService.getUploadUrl(
        fastify,
        channelId,
        organizationId,
        userRoles,
        filename,
        mimeType,
        sizeBytes
      )
      return success(reply, result)
    }
  )

  // POST /channels/:channelId/messages/:messageId/attachments — confirm after upload
  fastify.post(
    '/:channelId/messages/:messageId/attachments',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId, messageId } = request.params as {
        channelId: string
        messageId: string
      }
      const { id: userId, organizationId } = request.user
      const data = request.body as {
        filename: string
        mimeType: string
        sizeBytes: number
        storageKey: string
      }
      const attachment = await channelService.confirmAttachment(
        fastify,
        messageId,
        channelId,
        organizationId,
        userId,
        data
      )
      return created(reply, attachment)
    }
  )

  // GET /channels/:channelId/attachments/:attachmentId/download-url
  fastify.get(
    '/:channelId/attachments/:attachmentId/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { channelId, attachmentId } = request.params as {
        channelId: string
        attachmentId: string
      }
      const { id: userId, organizationId } = request.user
      const userRoles = await getUserRoles(fastify, userId, organizationId)
      const result = await channelService.getAttachmentDownloadUrl(
        fastify,
        attachmentId,
        channelId,
        organizationId,
        userRoles
      )
      return success(reply, result)
    }
  )
}

export default channelRoutes
