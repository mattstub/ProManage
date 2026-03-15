import { updateOrganizationSchema } from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as orgService from '../../services/organization.service'

import type { FastifyPluginAsync } from 'fastify'

const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /organizations/current
  fastify.get(
    '/current',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const org = await orgService.getOrganization(
        fastify,
        request.user.organizationId
      )
      return success(reply, org)
    }
  )

  // PATCH /organizations/current
  fastify.patch(
    '/current',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const input = updateOrganizationSchema.parse(request.body)
      const org = await orgService.updateOrganization(
        fastify,
        request.user.organizationId,
        input
      )
      return success(reply, org)
    }
  )
}

export default organizationRoutes
