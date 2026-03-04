import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import * as dashboardService from '../../services/dashboard.service'

import type { FastifyPluginAsync } from 'fastify'

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate)

  // GET /dashboard/stats
  fastify.get('/stats', async (request, reply) => {
    const stats = await dashboardService.getDashboardStats(
      fastify,
      request.user.organizationId
    )
    return success(reply, stats)
  })
}

export default dashboardRoutes
