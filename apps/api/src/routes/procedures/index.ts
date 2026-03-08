import rateLimit from '@fastify/rate-limit'

import { createProcedureSchema, updateProcedureSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { created, noContent, paginated, success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as procedureService from '../../services/procedure.service'

import type { ProcedureStatus } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'

const procedureRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    global: false,
  })

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /procedures - List procedures (all authenticated users)
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        status?: ProcedureStatus
        category?: string
        projectId?: string
      }
      const { procedures, meta } = await procedureService.listProcedures(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, procedures, meta)
    }
  )

  // GET /procedures/:id - Get single procedure (all authenticated users)
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const procedure = await procedureService.getProcedure(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, procedure)
    }
  )

  // POST /procedures - Create procedure (Admin, ProjectManager, OfficeAdmin only)
  fastify.post(
    '/',
    {
      preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'OfficeAdmin')],
    },
    async (request, reply) => {
      const input = createProcedureSchema.parse(request.body)
      const procedure = await procedureService.createProcedure(
        fastify,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, procedure)
    }
  )

  // PATCH /procedures/:id - Update procedure (Admin, ProjectManager, OfficeAdmin only)
  fastify.patch(
    '/:id',
    {
      preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'OfficeAdmin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateProcedureSchema.parse(request.body)
      const procedure = await procedureService.updateProcedure(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, procedure)
    }
  )

  // DELETE /procedures/:id - Delete procedure (Admin only)
  fastify.delete(
    '/:id',
    {
      preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await procedureService.deleteProcedure(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default procedureRoutes
