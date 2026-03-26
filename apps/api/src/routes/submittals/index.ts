import {
  createSubmittalDocumentSchema,
  createSubmittalSchema,
  updateSubmittalDocumentSchema,
  updateSubmittalSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as submittalService from '../../services/submittal.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const

const submittalRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)

  // ─── Submittals ───────────────────────────────────────────────────────────────

  // GET /submittals?projectId=xxx
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.query as { projectId?: string }
      if (!projectId) return reply.code(400).send({ error: 'projectId query param is required' })
      const submittals = await submittalService.listSubmittals(
        fastify,
        request.user.organizationId,
        projectId
      )
      return success(reply, submittals)
    }
  )

  // GET /submittals/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const submittal = await submittalService.getSubmittal(fastify, id, request.user.organizationId)
      return success(reply, submittal)
    }
  )

  // POST /submittals
  fastify.post(
    '/',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const body = createSubmittalSchema.parse(request.body)
      const submittal = await submittalService.createSubmittal(
        fastify,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, submittal)
    }
  )

  // PATCH /submittals/:id
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateSubmittalSchema.parse(request.body)
      const submittal = await submittalService.updateSubmittal(
        fastify,
        id,
        request.user.organizationId,
        body
      )
      return success(reply, submittal)
    }
  )

  // DELETE /submittals/:id
  fastify.delete(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await submittalService.deleteSubmittal(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Submittal Documents ──────────────────────────────────────────────────────

  // GET /submittals/:id/documents
  fastify.get(
    '/:id/documents',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const docs = await submittalService.listSubmittalDocuments(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, docs)
    }
  )

  // POST /submittals/:id/documents
  fastify.post(
    '/:id/documents',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = createSubmittalDocumentSchema.parse(request.body)
      const doc = await submittalService.createSubmittalDocument(
        fastify,
        id,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, doc)
    }
  )

  // PATCH /submittals/:id/documents/:docId
  fastify.patch(
    '/:id/documents/:docId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const body = updateSubmittalDocumentSchema.parse(request.body)
      const doc = await submittalService.updateSubmittalDocument(
        fastify,
        id,
        docId,
        request.user.organizationId,
        body
      )
      return success(reply, doc)
    }
  )

  // DELETE /submittals/:id/documents/:docId
  fastify.delete(
    '/:id/documents/:docId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      await submittalService.deleteSubmittalDocument(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // POST /submittals/:id/documents/:docId/upload-url
  fastify.post(
    '/:id/documents/:docId/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const result = await submittalService.getSubmittalDocumentUploadUrl(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return success(reply, result)
    }
  )

  // GET /submittals/:id/documents/:docId/download-url
  fastify.get(
    '/:id/documents/:docId/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const result = await submittalService.getSubmittalDocumentDownloadUrl(
        fastify,
        id,
        docId,
        request.user.organizationId
      )
      return success(reply, result)
    }
  )
}

export default submittalRoutes
