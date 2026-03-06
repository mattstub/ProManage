import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as dashboardService from '../../services/dashboard.service'

import type { FastifyPluginAsync } from 'fastify'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /dashboard/stats
  fastify.get(
    '/stats',
    {
      preHandler: [authenticate],
      config: {
        rateLimit: RATE_LIMITS.READ,
      },
    },
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
