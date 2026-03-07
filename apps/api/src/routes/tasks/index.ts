import rateLimit from '@fastify/rate-limit'

import { createTaskSchema, updateTaskSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { created, noContent, paginated, success } from '../../lib/response'
import * as taskService from '../../services/task.service'

import type { TaskStatus } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    // Enable a global rate limit so that all requests, including those
    // passing through the authenticate preHandler, are protected.
    global: true,
    max: 100,
    timeWindow: '1 minute',
  })

  // Apply a default rate limit to all routes in this plugin unless they
  // explicitly define their own `config.rateLimit`. This keeps per-route
  // configuration explicit without changing the effective limits.
  fastify.addHook('onRoute', (routeOptions) => {
    if (!routeOptions.config) {
      routeOptions.config = {}
    }
    if (!('rateLimit' in routeOptions.config!)) {
      ;(routeOptions.config as Record<string, unknown>).rateLimit = {
        max: 100,
        timeWindow: '1 minute',
      }
    }
  })

  // Authenticate hook applied globally
  fastify.addHook('preHandler', authenticate)

  // GET /tasks - List tasks (all authenticated users)
  fastify.get(
    '/',
    {
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      },
    },
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
    {
      config: {
        rateLimit: {
          max: 200,
          timeWindow: '1 minute',
        },
      },
    },
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
      preHandler: [requireRole('Admin', 'ProjectManager', 'OfficeAdmin')],
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
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
    {
      config: {
        rateLimit: {
          max: 50,
          timeWindow: '1 minute',
        },
      },
    },
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
      preHandler: [requireRole('Admin')],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await taskService.deleteTask(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default taskRoutes
