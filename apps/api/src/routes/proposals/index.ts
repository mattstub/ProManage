import {
  createProposalSchema,
  createProposalTemplateSchema,
  updateProposalSchema,
  updateProposalTemplateSchema,
  upsertProposalLineItemsSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as proposalService from '../../services/proposal.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const

const proposalRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Proposals ─────────────────────────────────────────────────────────────

  // GET /proposals
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        status?: string
        projectId?: string
        customerId?: string
      }
      const proposals = await proposalService.listProposals(
        fastify,
        request.user.organizationId,
        query as Parameters<typeof proposalService.listProposals>[2]
      )
      return success(reply, proposals)
    }
  )

  // GET /proposals/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const proposal = await proposalService.getProposal(fastify, id, request.user.organizationId)
      return success(reply, proposal)
    }
  )

  // POST /proposals
  fastify.post(
    '/',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createProposalSchema.parse(request.body)
      const proposal = await proposalService.createProposal(
        fastify,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, proposal)
    }
  )

  // PATCH /proposals/:id
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateProposalSchema.parse(request.body)
      const proposal = await proposalService.updateProposal(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, proposal)
    }
  )

  // DELETE /proposals/:id
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await proposalService.deleteProposal(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // PUT /proposals/:id/line-items
  fastify.put(
    '/:id/line-items',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = upsertProposalLineItemsSchema.parse(request.body)
      const proposal = await proposalService.upsertLineItems(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, proposal)
    }
  )

  // POST /proposals/from-estimate/:estimateId — stub for Phase 5.1 integration
  fastify.post(
    '/from-estimate/:estimateId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (_request, reply) => {
      return reply.status(501).send({
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Estimate-to-proposal integration will be available after Phase 5.1 wiring',
        },
      })
    }
  )

  // ─── Proposal Templates ────────────────────────────────────────────────────

  // GET /proposals/templates
  fastify.get(
    '/templates',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as { activeOnly?: string }
      const templates = await proposalService.listProposalTemplates(
        fastify,
        request.user.organizationId,
        query.activeOnly === 'true'
      )
      return success(reply, templates)
    }
  )

  // GET /proposals/templates/:id
  fastify.get(
    '/templates/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const template = await proposalService.getProposalTemplate(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, template)
    }
  )

  // POST /proposals/templates
  fastify.post(
    '/templates',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createProposalTemplateSchema.parse(request.body)
      const template = await proposalService.createProposalTemplate(
        fastify,
        request.user.organizationId,
        body
      )
      return created(reply, template)
    }
  )

  // PATCH /proposals/templates/:id
  fastify.patch(
    '/templates/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateProposalTemplateSchema.parse(request.body)
      const template = await proposalService.updateProposalTemplate(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, template)
    }
  )

  // DELETE /proposals/templates/:id
  fastify.delete(
    '/templates/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await proposalService.deleteProposalTemplate(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default proposalRoutes
