import {
  createBidResultSchema,
  createEstimateItemSchema,
  createEstimateItemVendorQuoteSchema,
  createEstimateSchema,
  updateBidResultSchema,
  updateEstimateItemSchema,
  updateEstimateSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as estimationService from '../../services/estimation.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager'] as const
const ITEM_WRITE_ROLES = ['Admin', 'ProjectManager', 'Superintendent'] as const

const estimationRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Org-level list ────────────────────────────────────────────────────────

  // GET /estimation — all estimates for org
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const estimates = await estimationService.listAllEstimates(fastify, request.user.organizationId)
      return success(reply, estimates)
    }
  )

  // ─── Project-scoped estimates ──────────────────────────────────────────────

  // GET /estimation/:projectId
  fastify.get(
    '/:projectId',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const estimates = await estimationService.listEstimates(
        fastify,
        projectId,
        request.user.organizationId
      )
      return success(reply, estimates)
    }
  )

  // POST /estimation/:projectId
  fastify.post(
    '/:projectId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const body = createEstimateSchema.parse(request.body)
      const estimate = await estimationService.createEstimate(
        fastify,
        projectId,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, estimate)
    }
  )

  // GET /estimation/:projectId/:estimateId
  fastify.get(
    '/:projectId/:estimateId',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const estimate = await estimationService.getEstimate(
        fastify,
        estimateId,
        request.user.organizationId
      )
      return success(reply, estimate)
    }
  )

  // GET /estimation/:projectId/:estimateId/summary
  fastify.get(
    '/:projectId/:estimateId/summary',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const summary = await estimationService.getEstimateSummary(
        fastify,
        estimateId,
        request.user.organizationId
      )
      return success(reply, summary)
    }
  )

  // PATCH /estimation/:projectId/:estimateId
  fastify.patch(
    '/:projectId/:estimateId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const body = updateEstimateSchema.parse(request.body)
      const estimate = await estimationService.updateEstimate(
        fastify,
        estimateId,
        request.user.organizationId,
        body
      )
      return success(reply, estimate)
    }
  )

  // DELETE /estimation/:projectId/:estimateId
  fastify.delete(
    '/:projectId/:estimateId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      await estimationService.deleteEstimate(fastify, estimateId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Estimate Items ────────────────────────────────────────────────────────

  // GET /estimation/:projectId/:estimateId/items
  fastify.get(
    '/:projectId/:estimateId/items',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const items = await estimationService.listEstimateItems(
        fastify,
        estimateId,
        request.user.organizationId
      )
      return success(reply, items)
    }
  )

  // POST /estimation/:projectId/:estimateId/items
  fastify.post(
    '/:projectId/:estimateId/items',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...ITEM_WRITE_ROLES)] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const body = createEstimateItemSchema.parse(request.body)
      const item = await estimationService.createEstimateItem(
        fastify,
        estimateId,
        request.user.organizationId,
        body
      )
      return created(reply, item)
    }
  )

  // PATCH /estimation/:projectId/:estimateId/items/:itemId
  fastify.patch(
    '/:projectId/:estimateId/items/:itemId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...ITEM_WRITE_ROLES)] },
    async (request, reply) => {
      const { estimateId, itemId } = request.params as {
        projectId: string
        estimateId: string
        itemId: string
      }
      const body = updateEstimateItemSchema.parse(request.body)
      const item = await estimationService.updateEstimateItem(
        fastify,
        itemId,
        estimateId,
        request.user.organizationId,
        body
      )
      return success(reply, item)
    }
  )

  // DELETE /estimation/:projectId/:estimateId/items/:itemId
  fastify.delete(
    '/:projectId/:estimateId/items/:itemId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { estimateId, itemId } = request.params as {
        projectId: string
        estimateId: string
        itemId: string
      }
      await estimationService.deleteEstimateItem(
        fastify,
        itemId,
        estimateId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Vendor Quotes ─────────────────────────────────────────────────────────

  // GET /estimation/:projectId/:estimateId/items/:itemId/quotes
  fastify.get(
    '/:projectId/:estimateId/items/:itemId/quotes',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { itemId } = request.params as {
        projectId: string
        estimateId: string
        itemId: string
      }
      const quotes = await estimationService.listVendorQuotes(
        fastify,
        itemId,
        request.user.organizationId
      )
      return success(reply, quotes)
    }
  )

  // POST /estimation/:projectId/:estimateId/items/:itemId/quotes
  fastify.post(
    '/:projectId/:estimateId/items/:itemId/quotes',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { itemId } = request.params as {
        projectId: string
        estimateId: string
        itemId: string
      }
      const body = createEstimateItemVendorQuoteSchema.parse(request.body)
      const quote = await estimationService.upsertVendorQuote(
        fastify,
        itemId,
        request.user.organizationId,
        body
      )
      return created(reply, quote)
    }
  )

  // DELETE /estimation/:projectId/:estimateId/items/:itemId/quotes/:quoteId
  fastify.delete(
    '/:projectId/:estimateId/items/:itemId/quotes/:quoteId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { quoteId } = request.params as {
        projectId: string
        estimateId: string
        itemId: string
        quoteId: string
      }
      await estimationService.deleteVendorQuote(fastify, quoteId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Bid Results ───────────────────────────────────────────────────────────

  // GET /estimation/:projectId/:estimateId/bid-results
  fastify.get(
    '/:projectId/:estimateId/bid-results',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const results = await estimationService.listBidResults(
        fastify,
        estimateId,
        request.user.organizationId
      )
      return success(reply, results)
    }
  )

  // POST /estimation/:projectId/:estimateId/bid-results
  fastify.post(
    '/:projectId/:estimateId/bid-results',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { estimateId } = request.params as { projectId: string; estimateId: string }
      const body = createBidResultSchema.parse(request.body)
      const result = await estimationService.createBidResult(
        fastify,
        estimateId,
        request.user.organizationId,
        body
      )
      return created(reply, result)
    }
  )

  // PATCH /estimation/:projectId/:estimateId/bid-results/:resultId
  fastify.patch(
    '/:projectId/:estimateId/bid-results/:resultId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { resultId } = request.params as {
        projectId: string
        estimateId: string
        resultId: string
      }
      const body = updateBidResultSchema.parse(request.body)
      const result = await estimationService.updateBidResult(
        fastify,
        resultId,
        request.user.organizationId,
        body
      )
      return success(reply, result)
    }
  )

  // DELETE /estimation/:projectId/:estimateId/bid-results/:resultId
  fastify.delete(
    '/:projectId/:estimateId/bid-results/:resultId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { resultId } = request.params as {
        projectId: string
        estimateId: string
        resultId: string
      }
      await estimationService.deleteBidResult(fastify, resultId, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default estimationRoutes
