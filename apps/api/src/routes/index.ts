import authRoutes from './auth'
import dashboardRoutes from './dashboard'
import organizationRoutes from './organizations'
import projectRoutes from './projects'
import userRoutes from './users'

import type { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(dashboardRoutes, { prefix: '/dashboard' })
  fastify.register(organizationRoutes, { prefix: '/organizations' })
  fastify.register(projectRoutes, { prefix: '/projects' })
  fastify.register(userRoutes, { prefix: '/users' })
}

export default routes
