import {
  createCostCodeSchema,
  createMaterialSchema,
  updateCostCodeSchema,
  updateMaterialSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as materialService from '../../services/material.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const
const MANAGE_ROLES = ['Admin', 'OfficeAdmin'] as const

const materialRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Cost Codes ────────────────────────────────────────────────────────────

  // GET /materials/cost-codes
  fastify.get(
    '/cost-codes',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as { search?: string; isActive?: string }
      const isActive =
        query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined
      const costCodes = await materialService.listCostCodes(
        fastify,
        request.user.organizationId,
        { search: query.search, isActive }
      )
      return success(reply, costCodes)
    }
  )

  // POST /materials/cost-codes
  fastify.post(
    '/cost-codes',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createCostCodeSchema.parse(request.body)
      const costCode = await materialService.createCostCode(
        fastify,
        request.user.organizationId,
        body
      )
      return created(reply, costCode)
    }
  )

  // PATCH /materials/cost-codes/:id
  fastify.patch(
    '/cost-codes/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateCostCodeSchema.parse(request.body)
      const costCode = await materialService.updateCostCode(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, costCode)
    }
  )

  // DELETE /materials/cost-codes/:id
  fastify.delete(
    '/cost-codes/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await materialService.deleteCostCode(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Materials ─────────────────────────────────────────────────────────────

  // GET /materials
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        search?: string
        unit?: string
        costCodeId?: string
        isActive?: string
      }
      const isActive =
        query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined
      const { materials, pagination } = await materialService.listMaterials(
        fastify,
        request.user.organizationId,
        { ...query, isActive }
      )
      return paginated(reply, materials, pagination)
    }
  )

  // GET /materials/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const material = await materialService.getMaterial(fastify, id, request.user.organizationId)
      return success(reply, material)
    }
  )

  // POST /materials
  fastify.post(
    '/',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createMaterialSchema.parse(request.body)
      const material = await materialService.createMaterial(
        fastify,
        request.user.organizationId,
        body,
        request.user.id
      )
      return created(reply, material)
    }
  )

  // PATCH /materials/:id
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateMaterialSchema.parse(request.body)
      const material = await materialService.updateMaterial(
        fastify,
        id,
        request.user.organizationId,
        body,
        request.user.id
      )
      return success(reply, material)
    }
  )

  // DELETE /materials/:id
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await materialService.deleteMaterial(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // GET /materials/:id/price-history
  fastify.get(
    '/:id/price-history',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const history = await materialService.getMaterialPriceHistory(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, history)
    }
  )
}

export default materialRoutes
