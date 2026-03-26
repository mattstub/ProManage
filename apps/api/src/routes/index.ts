import authRoutes from './auth'
import calendarEventRoutes from './calendar-events'
import channelRoutes from './channels'
import constructionDocumentRoutes from './construction-documents'
import contactRoutes from './contacts'
import contractRoutes from './contracts'
import dashboardRoutes from './dashboard'
import estimationRoutes from './estimation'
import jobSafetyRoutes from './job-safety'
import licenseRoutes from './licenses'
import materialRoutes from './materials'
import messageRoutes from './messages'
import notificationRoutes from './notifications'
import organizationRoutes from './organizations'
import procedureRoutes from './procedures'
import projectRoutes from './projects'
import proposalRoutes from './proposals'
import safetyRoutes from './safety'
import submittalRoutes from './submittals'
import taskRoutes from './tasks'
import userRoutes from './users'

import type { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(authRoutes, { prefix: '/auth' })
  fastify.register(calendarEventRoutes, { prefix: '/calendar-events' })
  fastify.register(channelRoutes, { prefix: '/channels' })
  fastify.register(constructionDocumentRoutes, { prefix: '/construction-documents' })
  fastify.register(contactRoutes, { prefix: '/contacts' })
  fastify.register(contractRoutes, { prefix: '/contracts' })
  fastify.register(dashboardRoutes, { prefix: '/dashboard' })
  fastify.register(estimationRoutes, { prefix: '/estimation' })
  fastify.register(jobSafetyRoutes, { prefix: '/projects' })
  fastify.register(licenseRoutes, { prefix: '/licenses' })
  fastify.register(materialRoutes, { prefix: '/materials' })
  fastify.register(messageRoutes, { prefix: '/messages' })
  fastify.register(notificationRoutes, { prefix: '/notifications' })
  fastify.register(organizationRoutes, { prefix: '/organizations' })
  fastify.register(procedureRoutes, { prefix: '/procedures' })
  fastify.register(projectRoutes, { prefix: '/projects' })
  fastify.register(proposalRoutes, { prefix: '/proposals' })
  fastify.register(safetyRoutes, { prefix: '/safety' })
  fastify.register(submittalRoutes, { prefix: '/submittals' })
  fastify.register(taskRoutes, { prefix: '/tasks' })
  fastify.register(userRoutes, { prefix: '/users' })
}

export default routes
