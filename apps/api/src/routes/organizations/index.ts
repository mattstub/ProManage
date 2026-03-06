import { updateOrganizationSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as orgService from '../../services/organization.service'

import type { FastifyPluginAsync } from 'fastify'

const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /organizations/current
  fastify.get(
    '/current',
    {
      preHandler: [authenticate],
      config: {
        rateLimit: RATE_LIMITS.READ,
      },
    },
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
    {
      preHandler: [authenticate, requireRole('Admin')],
      config: {
        rateLimit: RATE_LIMITS.SENSITIVE,
      },
    },
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
