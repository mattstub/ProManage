import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import { routeRateLimit } from '../../lib/rate-limit'
import * as dashboardService from '../../services/dashboard.service'

import type { FastifyPluginAsync } from 'fastify'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate)

  // GET /dashboard/stats
  fastify.get(
    '/stats',
    routeRateLimit('READ'),
    async (request, reply) => {
      const stats = await dashboardService.getDashboardStats(
        fastify,
        request.user.organizationId
      )
      return success(reply, stats)
    }
  )
}

export default dashboardRoutes
