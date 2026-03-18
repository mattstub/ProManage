import authRoutes from './auth'
import safetyRoutes from './safety'
import calendarEventRoutes from './calendar-events'
import channelRoutes from './channels'
import contactRoutes from './contacts'
import dashboardRoutes from './dashboard'
import licenseRoutes from './licenses'
import messageRoutes from './messages'
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
  fastify.register(contactRoutes, { prefix: '/contacts' })
  fastify.register(channelRoutes, { prefix: '/channels' })
  fastify.register(dashboardRoutes, { prefix: '/dashboard' })
  fastify.register(licenseRoutes, { prefix: '/licenses' })
  fastify.register(messageRoutes, { prefix: '/messages' })
  fastify.register(notificationRoutes, { prefix: '/notifications' })
  fastify.register(organizationRoutes, { prefix: '/organizations' })
  fastify.register(procedureRoutes, { prefix: '/procedures' })
  fastify.register(projectRoutes, { prefix: '/projects' })
  fastify.register(safetyRoutes, { prefix: '/safety' })
  fastify.register(taskRoutes, { prefix: '/tasks' })
  fastify.register(userRoutes, { prefix: '/users' })
}

export default routes
