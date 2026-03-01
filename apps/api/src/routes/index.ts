import authRoutes from './auth'
import userRoutes from './users'
import organizationRoutes from './organizations'

import type { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(userRoutes, { prefix: '/users' })
  fastify.register(organizationRoutes, { prefix: '/organizations' })
}

export default routes
