import {
  createContractDocumentSchema,
  createContractSchema,
  updateContractDocumentSchema,
  updateContractSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as contractService from '../../services/contract.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const

const contractRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)

  // ─── Contracts ───────────────────────────────────────────────────────────────

  // GET /contracts?projectId=xxx
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.query as { projectId?: string }
      if (!projectId) return reply.code(400).send({ error: 'projectId query param is required' })
      const contracts = await contractService.listContracts(
        fastify,
        request.user.organizationId,
        projectId
      )
      return success(reply, contracts)
    }
  )

  // GET /contracts/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const contract = await contractService.getContract(fastify, id, request.user.organizationId)
      return success(reply, contract)
    }
  )

  // POST /contracts
  fastify.post(
    '/',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createContractSchema.parse(request.body)
      const contract = await contractService.createContract(
        fastify,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, contract)
    }
  )

  // PATCH /contracts/:id
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateContractSchema.parse(request.body)
      const contract = await contractService.updateContract(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, contract)
    }
  )

  // DELETE /contracts/:id
  fastify.delete(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await contractService.deleteContract(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Contract Documents ───────────────────────────────────────────────────────

  // GET /contracts/:id/documents
  fastify.get(
    '/:id/documents',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const docs = await contractService.listContractDocuments(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, docs)
    }
  )

  // POST /contracts/:id/documents
  fastify.post(
    '/:id/documents',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = createContractDocumentSchema.parse(request.body)
      const doc = await contractService.createContractDocument(
        fastify,
        id,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, doc)
    }
  )

  // PATCH /contracts/:id/documents/:docId
  fastify.patch(
    '/:id/documents/:docId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const body = updateContractDocumentSchema.parse(request.body)
      const doc = await contractService.updateContractDocument(
        fastify,
        id,
        docId,
        request.user.organizationId,
        body
      )
      return success(reply, doc)
    }
  )

  // DELETE /contracts/:id/documents/:docId
  fastify.delete(
    '/:id/documents/:docId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      await contractService.deleteContractDocument(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // POST /contracts/:id/documents/:docId/upload-url
  fastify.post(
    '/:id/documents/:docId/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const result = await contractService.getContractDocumentUploadUrl(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return success(reply, result)
    }
  )

  // GET /contracts/:id/documents/:docId/download-url
  fastify.get(
    '/:id/documents/:docId/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const result = await contractService.getContractDocumentDownloadUrl(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return success(reply, result)
    }
  )
}

export default contractRoutes
