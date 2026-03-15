import { createTaskSchema, updateTaskSchema } from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as taskService from '../../services/task.service'

import type { TaskStatus } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  // Create rate limit preHandlers using fastify's rateLimit decorator
  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /tasks - List tasks (all authenticated users)
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        status?: TaskStatus
        assigneeId?: string
        projectId?: string
      }
      const { tasks, meta } = await taskService.listTasks(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, tasks, meta)
    }
  )

  // GET /tasks/:id - Get single task (all authenticated users)
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const task = await taskService.getTask(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, task)
    }
  )

  // POST /tasks - Create task (Admin, ProjectManager, OfficeAdmin only)
  fastify.post(
    '/',
    {
      preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'OfficeAdmin')],
    },
    async (request, reply) => {
      const input = createTaskSchema.parse(request.body)
      const task = await taskService.createTask(
        fastify,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, task)
    }
  )

  // PATCH /tasks/:id - Update task (Admin, ProjectManager, OfficeAdmin, or assignee)
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateTaskSchema.parse(request.body)
      const task = await taskService.updateTask(
        fastify,
        id,
        request.user.organizationId,
        request.user.id,
        input
      )
      return success(reply, task)
    }
  )

  // DELETE /tasks/:id - Delete task (Admin only)
  fastify.delete(
    '/:id',
    {
      preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await taskService.deleteTask(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default taskRoutes
