import { authenticate } from '../../middleware/authenticate'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { success } from '../../lib/response'
import * as dashboardService from '../../services/dashboard.service'

import type { FastifyPluginAsync } from 'fastify'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)

  // GET /dashboard/stats
  fastify.get(
    '/stats',
    { preHandler: [readRateLimiter, authenticate] },
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
