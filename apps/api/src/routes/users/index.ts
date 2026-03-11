import { updateUserSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { success, paginated, noContent } from '../../lib/response'
import * as userService from '../../services/user.service'

import type { FastifyPluginAsync } from 'fastify'

const userRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /users
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'OfficeAdmin')] },
    async (request, reply) => {
      const query = request.query as { page?: string; perPage?: string }
      const result = await userService.listUsers(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, result.data, result.meta)
    }
  )

  // GET /users/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = await userService.getUser(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, user)
    }
  )

  // PATCH /users/:id
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateUserSchema.parse(request.body)

      // Users can update themselves, admins can update anyone
      if (id !== request.user.id) {
        await requireRole('Admin')(request, reply)
      }

      const user = await userService.updateUser(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, user)
    }
  )

  // DELETE /users/:id
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await userService.deactivateUser(
        fastify,
        id,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )
}

export default userRoutes
