import { updateOrganizationSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { success } from '../../lib/response'
import { routeRateLimit } from '../../lib/rate-limit'
import * as orgService from '../../services/organization.service'

import type { FastifyPluginAsync } from 'fastify'

const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate)

  // GET /organizations/current
  fastify.get(
    '/current',
    routeRateLimit('READ'),
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
      preHandler: [requireRole('Admin')],
      ...routeRateLimit('SENSITIVE'),
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
