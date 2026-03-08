import { createProjectSchema, updateProjectSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { created, noContent, paginated, success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as projectService from '../../services/project.service'

import type { ProjectStatus } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'
import rateLimit from '@fastify/rate-limit'

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: false,
  })

  // Create rate limit preHandlers using fastify's rateLimit decorator
  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /projects
  fastify.get(
    '/',
    {
      preHandler: [readRateLimiter, authenticate],
    },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        status?: ProjectStatus
      }
      const { projects, meta } = await projectService.listProjects(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, projects, meta)
    }
  )

  // GET /projects/:id
  fastify.get(
    '/:id',
    {
      preHandler: [readRateLimiter, authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const project = await projectService.getProject(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, project)
    }
  )

  // POST /projects — Admin, ProjectManager only
  fastify.post(
    '/',
    {
      preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager')],
    },
    async (request, reply) => {
      const input = createProjectSchema.parse(request.body)
      const project = await projectService.createProject(
        fastify,
        request.user.organizationId,
        input
      )
      return created(reply, project)
    }
  )

  // PATCH /projects/:id — Admin, ProjectManager only
  fastify.patch(
    '/:id',
    {
      preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateProjectSchema.parse(request.body)
      const project = await projectService.updateProject(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, project)
    }
  )

  // DELETE /projects/:id — Admin only (archives)
  fastify.delete(
    '/:id',
    {
      preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await projectService.archiveProject(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default projectRoutes
