import { createProjectSchema, updateProjectSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { created, noContent, paginated, success } from '../../lib/response'
import * as projectService from '../../services/project.service'

import type { ProjectStatus } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authenticate)

  // GET /projects
  fastify.get('/', async (request, reply) => {
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
  })

  // GET /projects/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const project = await projectService.getProject(
      fastify,
      id,
      request.user.organizationId
    )
    return success(reply, project)
  })

  // POST /projects — Admin, ProjectManager only
  fastify.post(
    '/',
    { preHandler: [requireRole('Admin', 'ProjectManager')] },
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
    { preHandler: [requireRole('Admin', 'ProjectManager')] },
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
    { preHandler: [requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await projectService.archiveProject(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default projectRoutes
