import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MINIO_BUCKET_NAME,
  createIncidentReportSchema,
  createSafetyDocumentSchema,
  createSafetyFormSchema,
  createSdsEntrySchema,
  createToolboxTalkAttendeeSchema,
  createToolboxTalkSchema,
  updateIncidentReportSchema,
  updateSafetyDocumentSchema,
  updateSafetyFormSchema,
  updateSdsEntrySchema,
  updateToolboxTalkSchema,
} from '@promanage/core'

import { ValidationError } from '../../lib/errors'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as safetyService from '../../services/safety.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin'] as const
const MANAGE_ROLES = ['Admin', 'OfficeAdmin'] as const

const safetyRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Safety Documents ─────────────────────────────────────────────────────

  // GET /safety/documents — all authenticated users
  fastify.get('/documents', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const query = request.query as { page?: string; perPage?: string; search?: string; category?: string }
    const { documents, pagination } = await safetyService.listSafetyDocuments(
      fastify,
      request.user.organizationId,
      {
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
        search: query.search,
        category: query.category,
      }
    )
    return paginated(reply, documents, pagination)
  })

  // GET /safety/documents/:id — all authenticated users
  fastify.get('/documents/:id', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const doc = await safetyService.getSafetyDocument(fastify, id, request.user.organizationId)
    return success(reply, doc)
  })

  // GET /safety/documents/:id/download-url — all authenticated users
  fastify.get(
    '/documents/:id/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const doc = await safetyService.getSafetyDocument(fastify, id, request.user.organizationId)

      // Expect the SafetyDocument record to contain the storage key and file name
      const { fileKey, fileName } = doc as { fileKey: string; fileName: string }
      if (!fileKey) {
        throw new ValidationError('Document file is not available for download')
      }

      const downloadUrl = await fastify.minio.presignedGetObject(MINIO_BUCKET_NAME, fileKey, 900)
      return success(reply, { downloadUrl, fileName })
    }
  )

  // POST /safety/documents/upload-url — request presigned upload URL
  fastify.post(
    '/documents/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { fileName, mimeType, fileSize } = request.body as {
        fileName: string
        mimeType: string
        fileSize: number
      }
      if (!(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
        throw new ValidationError(`Unsupported file type: ${mimeType}`)
      }
      if (fileSize <= 0) throw new ValidationError('File must not be empty')
      if (fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new ValidationError(`File exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES} bytes`)
      }
      const organizationId = request.user.organizationId
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileKey = `safety/documents/${organizationId}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`
      const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, fileKey, 900)
      return success(reply, { uploadUrl, fileKey, fileName, mimeType, fileSize })
    }
  )

  // POST /safety/documents — create after upload
  fastify.post(
    '/documents',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const input = createSafetyDocumentSchema.parse(request.body)
      const expectedPrefix = `safety/documents/${request.user.organizationId}/`
      if (!input.fileKey.startsWith(expectedPrefix) || input.fileKey.length <= expectedPrefix.length) {
        throw new ValidationError('Invalid file key')
      }
      const doc = await safetyService.createSafetyDocument(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, doc)
    }
  )

  // PATCH /safety/documents/:id — Admin, PM, Superintendent, OfficeAdmin
  fastify.patch(
    '/documents/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateSafetyDocumentSchema.parse(request.body)
      const doc = await safetyService.updateSafetyDocument(fastify, id, request.user.organizationId, input)
      return success(reply, doc)
    }
  )

  // DELETE /safety/documents/:id — Admin, OfficeAdmin
  fastify.delete(
    '/documents/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await safetyService.deleteSafetyDocument(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── SDS Catalog ─────────────────────────────────────────────────────────

  // GET /safety/sds — all authenticated users
  fastify.get('/sds', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const query = request.query as { page?: string; perPage?: string; search?: string }
    const { entries, pagination } = await safetyService.listSdsEntries(
      fastify,
      request.user.organizationId,
      {
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
        search: query.search,
      }
    )
    return paginated(reply, entries, pagination)
  })

  // GET /safety/sds/:id — all authenticated users
  fastify.get('/sds/:id', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const entry = await safetyService.getSdsEntry(fastify, id, request.user.organizationId)
    return success(reply, entry)
  })

  // POST /safety/sds/upload-url — presigned PUT URL for SDS PDF
  fastify.post(
    '/sds/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { fileName, mimeType, fileSize } = request.body as {
        fileName: string
        mimeType: string
        fileSize: number
      }
      if (!(ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
        throw new ValidationError(`Unsupported file type: ${mimeType}`)
      }
      if (fileSize <= 0) throw new ValidationError('File must not be empty')
      if (fileSize > MAX_ATTACHMENT_SIZE_BYTES) {
        throw new ValidationError(`File exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES} bytes`)
      }
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileKey = `safety/sds/${request.user.organizationId}/${Date.now()}-${uuidv4()}-${sanitizedFileName}`
      const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, fileKey, 900)
      return success(reply, { uploadUrl, fileKey, fileName, mimeType, fileSize })
    }
  )

  // POST /safety/sds — create
  fastify.post(
    '/sds',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const input = createSdsEntrySchema.parse(request.body)
      if (input.sdsFileKey) {
        const expectedPrefix = 'safety/sds/'
        if (!input.sdsFileKey.startsWith(expectedPrefix) || input.sdsFileKey.length <= expectedPrefix.length) {
          throw new ValidationError('Invalid file key')
        }
      }
      const entry = await safetyService.createSdsEntry(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, entry)
    }
  )

  // PATCH /safety/sds/:id
  fastify.patch(
    '/sds/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateSdsEntrySchema.parse(request.body)
      const entry = await safetyService.updateSdsEntry(fastify, id, request.user.organizationId, input)
      return success(reply, entry)
    }
  )

  // DELETE /safety/sds/:id — Admin, OfficeAdmin
  fastify.delete(
    '/sds/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...MANAGE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await safetyService.deleteSdsEntry(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Toolbox Talks ────────────────────────────────────────────────────────

  // GET /safety/toolbox-talks — all authenticated users
  fastify.get('/toolbox-talks', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const query = request.query as {
      page?: string; perPage?: string; search?: string; status?: string; projectId?: string
    }
    const { talks, pagination } = await safetyService.listToolboxTalks(
      fastify,
      request.user.organizationId,
      {
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
        search: query.search,
        status: query.status,
        projectId: query.projectId,
      }
    )
    return paginated(reply, talks, pagination)
  })

  // GET /safety/toolbox-talks/:id — all authenticated users
  fastify.get('/toolbox-talks/:id', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const talk = await safetyService.getToolboxTalk(fastify, id, request.user.organizationId)
    return success(reply, talk)
  })

  // POST /safety/toolbox-talks — Admin, PM, Superintendent, OfficeAdmin (WRITE_ROLES)
  fastify.post(
    '/toolbox-talks',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const input = createToolboxTalkSchema.parse(request.body)
      const talk = await safetyService.createToolboxTalk(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, talk)
    }
  )

  // PATCH /safety/toolbox-talks/:id — Admin, PM, Superintendent, OfficeAdmin (WRITE_ROLES)
  fastify.patch(
    '/toolbox-talks/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateToolboxTalkSchema.parse(request.body)
      const talk = await safetyService.updateToolboxTalk(fastify, id, request.user.organizationId, input)
      return success(reply, talk)
    }
  )

  // DELETE /safety/toolbox-talks/:id — Admin, PM, Superintendent
  fastify.delete(
    '/toolbox-talks/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await safetyService.deleteToolboxTalk(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // POST /safety/toolbox-talks/:id/attendees — add attendee
  fastify.post(
    '/toolbox-talks/:id/attendees',
    { preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent', 'Foreman')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = createToolboxTalkAttendeeSchema.parse(request.body)
      const attendee = await safetyService.addAttendee(fastify, id, request.user.organizationId, input)
      return created(reply, attendee)
    }
  )

  // DELETE /safety/toolbox-talks/:id/attendees/:attendeeId — remove attendee
  fastify.delete(
    '/toolbox-talks/:id/attendees/:attendeeId',
    { preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent', 'Foreman')] },
    async (request, reply) => {
      const { id, attendeeId } = request.params as { id: string; attendeeId: string }
      await safetyService.removeAttendee(fastify, attendeeId, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Safety Forms ─────────────────────────────────────────────────────────

  // GET /safety/forms — all authenticated users
  fastify.get('/forms', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const query = request.query as {
      page?: string; perPage?: string; search?: string; category?: string; isActive?: string
    }
    const { forms, pagination } = await safetyService.listSafetyForms(
      fastify,
      request.user.organizationId,
      {
        page: query.page ? parseInt(query.page, 10) : undefined,
        limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
        search: query.search,
        category: query.category,
        isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      }
    )
    return paginated(reply, forms, pagination)
  })

  // GET /safety/forms/:id — all authenticated users
  fastify.get('/forms/:id', { preHandler: [readRateLimiter, authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const form = await safetyService.getSafetyForm(fastify, id, request.user.organizationId)
    return success(reply, form)
  })

  // POST /safety/forms — Admin, PM, OfficeAdmin
  fastify.post(
    '/forms',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...MANAGE_ROLES, 'ProjectManager')] },
    async (request, reply) => {
      const input = createSafetyFormSchema.parse(request.body)
      const form = await safetyService.createSafetyForm(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, form)
    }
  )

  // PATCH /safety/forms/:id
  fastify.patch(
    '/forms/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...MANAGE_ROLES, 'ProjectManager')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateSafetyFormSchema.parse(request.body)
      const form = await safetyService.updateSafetyForm(fastify, id, request.user.organizationId, input)
      return success(reply, form)
    }
  )

  // DELETE /safety/forms/:id — Admin only
  fastify.delete(
    '/forms/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await safetyService.deleteSafetyForm(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Incident Reports ─────────────────────────────────────────────────────

  // GET /safety/incidents — Admin, PM, Superintendent, OfficeAdmin
  fastify.get(
    '/incidents',
    { preHandler: [readRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin')] },
    async (request, reply) => {
      const query = request.query as {
        page?: string; perPage?: string; search?: string
        status?: string; incidentType?: string; projectId?: string
      }
      const { reports, pagination } = await safetyService.listIncidentReports(
        fastify,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          search: query.search,
          status: query.status,
          incidentType: query.incidentType,
          projectId: query.projectId,
        }
      )
      return paginated(reply, reports, pagination)
    }
  )

  // GET /safety/incidents/:id — Admin, PM, Superintendent, OfficeAdmin
  fastify.get(
    '/incidents/:id',
    { preHandler: [readRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const report = await safetyService.getIncidentReport(fastify, id, request.user.organizationId)
      return success(reply, report)
    }
  )

  // POST /safety/incidents — all authenticated users (field users must be able to report)
  fastify.post(
    '/incidents',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const input = createIncidentReportSchema.parse(request.body)
      const report = await safetyService.createIncidentReport(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, report)
    }
  )

  // PATCH /safety/incidents/:id — Admin, PM, Superintendent
  fastify.patch(
    '/incidents/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole('Admin', 'ProjectManager', 'Superintendent')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateIncidentReportSchema.parse(request.body)
      const report = await safetyService.updateIncidentReport(fastify, id, request.user.organizationId, input)
      return success(reply, report)
    }
  )

  // DELETE /safety/incidents/:id — Admin only
  fastify.delete(
    '/incidents/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await safetyService.deleteIncidentReport(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )
}

export default safetyRoutes
