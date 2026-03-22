import {
  ALLOWED_JHA_MIME_TYPES,
  MAX_JHA_FILE_SIZE_BYTES,
  addProjectSdsEntrySchema,
  createJobHazardAnalysisSchema,
  createProjectEmergencyContactSchema,
  updateJobHazardAnalysisSchema,
  updateProjectEmergencyContactSchema,
  updateProjectSdsEntrySchema,
} from '@promanage/core'

import { ValidationError } from '../../lib/errors'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as jobSafetyService from '../../services/job-safety.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin'] as const
const MANAGE_ROLES = ['Admin', 'ProjectManager', 'OfficeAdmin'] as const

const jobSafetyRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)

  // ─── Job Hazard Analyses ───────────────────────────────────────────────────

  // GET /:projectId/safety/jhas
  fastify.get(
    '/:projectId/safety/jhas',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as {
        page?: string
        perPage?: string
        search?: string
        status?: string
      }
      const { jhas, pagination } = await jobSafetyService.listJhas(
        fastify,
        projectId,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          search: query.search,
          status: query.status,
        }
      )
      return paginated(reply, jhas, pagination)
    }
  )

  // GET /:projectId/safety/jhas/:id
  fastify.get(
    '/:projectId/safety/jhas/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const jha = await jobSafetyService.getJha(fastify, id, projectId, request.user.organizationId)
      return success(reply, jha)
    }
  )

  // GET /:projectId/safety/jhas/upload-url
  fastify.get(
    '/:projectId/safety/jhas/upload-url',
    { preHandler: [readRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as { fileName?: string; mimeType?: string }

      if (!query.fileName || !query.mimeType) {
        throw new ValidationError('fileName and mimeType are required')
      }
      if (!ALLOWED_JHA_MIME_TYPES.includes(query.mimeType as (typeof ALLOWED_JHA_MIME_TYPES)[number])) {
        throw new ValidationError('File type not allowed')
      }

      const result = await jobSafetyService.getJhaUploadUrl(
        fastify,
        projectId,
        request.user.organizationId,
        query.fileName,
        query.mimeType
      )
      return success(reply, result)
    }
  )

  // GET /:projectId/safety/jhas/:id/download-url
  fastify.get(
    '/:projectId/safety/jhas/:id/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const result = await jobSafetyService.getJhaDownloadUrl(
        fastify,
        id,
        projectId,
        request.user.organizationId
      )
      return success(reply, result)
    }
  )

  // POST /:projectId/safety/jhas
  fastify.post(
    '/:projectId/safety/jhas',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const body = createJobHazardAnalysisSchema.parse(request.body)
      const jha = await jobSafetyService.createJha(
        fastify,
        projectId,
        request.user.organizationId,
        request.user.id,
        body
      )
      return created(reply, jha)
    }
  )

  // PATCH /:projectId/safety/jhas/:id
  fastify.patch(
    '/:projectId/safety/jhas/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const body = updateJobHazardAnalysisSchema.parse(request.body)
      const jha = await jobSafetyService.updateJha(
        fastify,
        id,
        projectId,
        request.user.organizationId,
        body
      )
      return success(reply, jha)
    }
  )

  // DELETE /:projectId/safety/jhas/:id
  fastify.delete(
    '/:projectId/safety/jhas/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      await jobSafetyService.deleteJha(fastify, id, projectId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Emergency Contacts ────────────────────────────────────────────────────

  // GET /:projectId/safety/emergency-contacts
  fastify.get(
    '/:projectId/safety/emergency-contacts',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const contacts = await jobSafetyService.listEmergencyContacts(
        fastify,
        projectId,
        request.user.organizationId
      )
      return success(reply, contacts)
    }
  )

  // GET /:projectId/safety/emergency-contacts/:id
  fastify.get(
    '/:projectId/safety/emergency-contacts/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const contact = await jobSafetyService.getEmergencyContact(
        fastify,
        id,
        projectId,
        request.user.organizationId
      )
      return success(reply, contact)
    }
  )

  // POST /:projectId/safety/emergency-contacts
  fastify.post(
    '/:projectId/safety/emergency-contacts',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const body = createProjectEmergencyContactSchema.parse(request.body)
      const contact = await jobSafetyService.createEmergencyContact(
        fastify,
        projectId,
        request.user.organizationId,
        body
      )
      return created(reply, contact)
    }
  )

  // PATCH /:projectId/safety/emergency-contacts/:id
  fastify.patch(
    '/:projectId/safety/emergency-contacts/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const body = updateProjectEmergencyContactSchema.parse(request.body)
      const contact = await jobSafetyService.updateEmergencyContact(
        fastify,
        id,
        projectId,
        request.user.organizationId,
        body
      )
      return success(reply, contact)
    }
  )

  // DELETE /:projectId/safety/emergency-contacts/:id
  fastify.delete(
    '/:projectId/safety/emergency-contacts/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      await jobSafetyService.deleteEmergencyContact(
        fastify,
        id,
        projectId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Project SDS Binder ────────────────────────────────────────────────────

  // GET /:projectId/safety/sds
  fastify.get(
    '/:projectId/safety/sds',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as { page?: string; perPage?: string; search?: string }
      const { entries, pagination } = await jobSafetyService.listProjectSdsEntries(
        fastify,
        projectId,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          search: query.search,
        }
      )
      return paginated(reply, entries, pagination)
    }
  )

  // POST /:projectId/safety/sds
  fastify.post(
    '/:projectId/safety/sds',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const body = addProjectSdsEntrySchema.parse(request.body)
      const entry = await jobSafetyService.addProjectSdsEntry(
        fastify,
        projectId,
        request.user.organizationId,
        body
      )
      return created(reply, entry)
    }
  )

  // PATCH /:projectId/safety/sds/:id
  fastify.patch(
    '/:projectId/safety/sds/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      const body = updateProjectSdsEntrySchema.parse(request.body)
      const entry = await jobSafetyService.updateProjectSdsEntry(
        fastify,
        id,
        projectId,
        request.user.organizationId,
        body
      )
      return success(reply, entry)
    }
  )

  // DELETE /:projectId/safety/sds/:id
  fastify.delete(
    '/:projectId/safety/sds/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { projectId, id } = request.params as { projectId: string; id: string }
      await jobSafetyService.removeProjectSdsEntry(
        fastify,
        id,
        projectId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Project-scoped safety document / toolbox talk / incident views ─────────

  // GET /:projectId/safety/documents
  fastify.get(
    '/:projectId/safety/documents',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as {
        page?: string
        perPage?: string
        search?: string
        category?: string
      }
      const { documents, pagination } = await jobSafetyService.listProjectSafetyDocuments(
        fastify,
        projectId,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          search: query.search,
          category: query.category,
        }
      )
      return paginated(reply, documents, pagination)
    }
  )

  // GET /:projectId/safety/toolbox-talks
  fastify.get(
    '/:projectId/safety/toolbox-talks',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as { page?: string; perPage?: string; status?: string }
      const { talks, pagination } = await jobSafetyService.listProjectToolboxTalks(
        fastify,
        projectId,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          status: query.status,
        }
      )
      return paginated(reply, talks, pagination)
    }
  )

  // GET /:projectId/safety/incidents
  fastify.get(
    '/:projectId/safety/incidents',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const query = request.query as {
        page?: string
        perPage?: string
        status?: string
        incidentType?: string
      }
      const { reports, pagination } = await jobSafetyService.listProjectIncidentReports(
        fastify,
        projectId,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          status: query.status,
          incidentType: query.incidentType,
        }
      )
      return paginated(reply, reports, pagination)
    }
  )

  // GET /:projectId/safety/jhas/max-file-size — helper for UI upload validation
  fastify.get(
    '/:projectId/safety/jhas/max-file-size',
    { preHandler: [readRateLimiter, authenticate] },
    async (_request, reply) => {
      return success(reply, { maxFileSizeBytes: MAX_JHA_FILE_SIZE_BYTES })
    }
  )
}

export default jobSafetyRoutes
