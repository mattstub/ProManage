import authRoutes from './auth'
import calendarEventRoutes from './calendar-events'
import dashboardRoutes from './dashboard'
import notificationRoutes from './notifications'
import organizationRoutes from './organizations'
import procedureRoutes from './procedures'
import projectRoutes from './projects'
import taskRoutes from './tasks'
import userRoutes from './users'

import type { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(calendarEventRoutes, { prefix: '/calendar-events' })
  fastify.register(dashboardRoutes, { prefix: '/dashboard' })
  fastify.register(notificationRoutes, { prefix: '/notifications' })
  fastify.register(organizationRoutes, { prefix: '/organizations' })
  fastify.register(procedureRoutes, { prefix: '/procedures' })
  fastify.register(projectRoutes, { prefix: '/projects' })
  fastify.register(taskRoutes, { prefix: '/tasks' })
  fastify.register(userRoutes, { prefix: '/users' })
}

export default routes
