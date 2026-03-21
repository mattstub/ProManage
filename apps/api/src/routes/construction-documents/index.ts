import {
  addDrawingRevisionSchema,
  addSpecificationRevisionSchema,
  createDrawingDisciplineSchema,
  createDrawingSetSchema,
  createDrawingSheetSchema,
  createSpecificationSectionSchema,
  updateDrawingDisciplineSchema,
  updateDrawingSetSchema,
  updateDrawingSheetSchema,
  updateSpecificationSectionSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as cdService from '../../services/construction-documents.service'

import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager'] as const
const UPLOAD_ROLES = ['Admin', 'ProjectManager', 'Superintendent'] as const

const constructionDocumentRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Disciplines (org-scoped) ─────────────────────────────────────────────

  // GET /construction-documents/disciplines
  fastify.get(
    '/disciplines',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const disciplines = await cdService.listDrawingDisciplines(fastify, request.user.organizationId)
      return success(reply, disciplines)
    }
  )

  // POST /construction-documents/disciplines — Admin, PM only
  fastify.post(
    '/disciplines',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const input = createDrawingDisciplineSchema.parse(request.body)
      const discipline = await cdService.createDrawingDiscipline(fastify, request.user.organizationId, input)
      return created(reply, discipline)
    }
  )

  // PATCH /construction-documents/disciplines/:disciplineId — Admin, PM only
  fastify.patch(
    '/disciplines/:disciplineId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { disciplineId } = request.params as { disciplineId: string }
      const input = updateDrawingDisciplineSchema.parse(request.body)
      const discipline = await cdService.updateDrawingDiscipline(
        fastify,
        disciplineId,
        request.user.organizationId,
        input
      )
      return success(reply, discipline)
    }
  )

  // DELETE /construction-documents/disciplines/:disciplineId — Admin only
  fastify.delete(
    '/disciplines/:disciplineId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { disciplineId } = request.params as { disciplineId: string }
      await cdService.deleteDrawingDiscipline(fastify, disciplineId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Drawing Sets (project-scoped) ────────────────────────────────────────

  // GET /construction-documents/:projectId/drawing-sets
  fastify.get(
    '/:projectId/drawing-sets',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const sets = await cdService.listDrawingSets(fastify, projectId, request.user.organizationId)
      return success(reply, sets)
    }
  )

  // POST /construction-documents/:projectId/drawing-sets — Admin, PM only
  fastify.post(
    '/:projectId/drawing-sets',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const input = createDrawingSetSchema.parse(request.body)
      const set = await cdService.createDrawingSet(
        fastify,
        projectId,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, set)
    }
  )

  // PATCH /construction-documents/:projectId/drawing-sets/:setId — Admin, PM only
  fastify.patch(
    '/:projectId/drawing-sets/:setId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, setId } = request.params as { projectId: string; setId: string }
      const input = updateDrawingSetSchema.parse(request.body)
      const set = await cdService.updateDrawingSet(
        fastify,
        setId,
        projectId,
        request.user.organizationId,
        input
      )
      return success(reply, set)
    }
  )

  // DELETE /construction-documents/:projectId/drawing-sets/:setId — Admin, PM only
  fastify.delete(
    '/:projectId/drawing-sets/:setId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, setId } = request.params as { projectId: string; setId: string }
      await cdService.deleteDrawingSet(fastify, setId, projectId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Drawing Sheets (project-scoped) ──────────────────────────────────────

  // GET /construction-documents/:projectId/drawing-sheets
  fastify.get(
    '/:projectId/drawing-sheets',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const sheets = await cdService.listDrawingSheets(fastify, projectId, request.user.organizationId)
      return success(reply, sheets)
    }
  )

  // POST /construction-documents/:projectId/drawing-sheets — Admin, PM only
  fastify.post(
    '/:projectId/drawing-sheets',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const input = createDrawingSheetSchema.parse(request.body)
      const sheet = await cdService.createDrawingSheet(
        fastify,
        projectId,
        request.user.organizationId,
        input
      )
      return created(reply, sheet)
    }
  )

  // PATCH /construction-documents/:projectId/drawing-sheets/:sheetId — Admin, PM only
  fastify.patch(
    '/:projectId/drawing-sheets/:sheetId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, sheetId } = request.params as { projectId: string; sheetId: string }
      const input = updateDrawingSheetSchema.parse(request.body)
      const sheet = await cdService.updateDrawingSheet(
        fastify,
        sheetId,
        projectId,
        request.user.organizationId,
        input
      )
      return success(reply, sheet)
    }
  )

  // DELETE /construction-documents/:projectId/drawing-sheets/:sheetId — Admin, PM only
  fastify.delete(
    '/:projectId/drawing-sheets/:sheetId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, sheetId } = request.params as { projectId: string; sheetId: string }
      await cdService.deleteDrawingSheet(fastify, sheetId, projectId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Drawing Revisions ────────────────────────────────────────────────────

  // GET /construction-documents/:projectId/drawing-sheets/:sheetId/revisions
  fastify.get(
    '/:projectId/drawing-sheets/:sheetId/revisions',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId, sheetId } = request.params as { projectId: string; sheetId: string }
      const revisions = await cdService.listDrawingRevisions(
        fastify,
        sheetId,
        projectId,
        request.user.organizationId
      )
      return success(reply, revisions)
    }
  )

  // POST /construction-documents/:projectId/drawing-sheets/:sheetId/revisions/upload-url
  fastify.post(
    '/:projectId/drawing-sheets/:sheetId/revisions/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...UPLOAD_ROLES)] },
    async (request, reply) => {
      const { projectId, sheetId } = request.params as { projectId: string; sheetId: string }
      const { fileName, mimeType, fileSize } = request.body as {
        fileName: string
        mimeType: string
        fileSize: number
      }
      const result = await cdService.getDrawingRevisionUploadUrl(
        fastify,
        sheetId,
        projectId,
        request.user.organizationId,
        fileName,
        mimeType,
        fileSize
      )
      return success(reply, result)
    }
  )

  // POST /construction-documents/:projectId/drawing-sheets/:sheetId/revisions
  fastify.post(
    '/:projectId/drawing-sheets/:sheetId/revisions',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...UPLOAD_ROLES)] },
    async (request, reply) => {
      const { projectId, sheetId } = request.params as { projectId: string; sheetId: string }
      const input = addDrawingRevisionSchema.parse(request.body)
      const revision = await cdService.addDrawingRevision(
        fastify,
        sheetId,
        projectId,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, revision)
    }
  )

  // DELETE /construction-documents/:projectId/drawing-sheets/:sheetId/revisions/:revisionId
  fastify.delete(
    '/:projectId/drawing-sheets/:sheetId/revisions/:revisionId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { sheetId, revisionId } = request.params as {
        projectId: string
        sheetId: string
        revisionId: string
      }
      await cdService.deleteDrawingRevision(fastify, revisionId, sheetId, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Specification Sections (project-scoped) ──────────────────────────────

  // GET /construction-documents/:projectId/spec-sections
  fastify.get(
    '/:projectId/spec-sections',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const sections = await cdService.listSpecificationSections(
        fastify,
        projectId,
        request.user.organizationId
      )
      return success(reply, sections)
    }
  )

  // POST /construction-documents/:projectId/spec-sections — Admin, PM only
  fastify.post(
    '/:projectId/spec-sections',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string }
      const input = createSpecificationSectionSchema.parse(request.body)
      const section = await cdService.createSpecificationSection(
        fastify,
        projectId,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, section)
    }
  )

  // PATCH /construction-documents/:projectId/spec-sections/:sectionId — Admin, PM only
  fastify.patch(
    '/:projectId/spec-sections/:sectionId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, sectionId } = request.params as { projectId: string; sectionId: string }
      const input = updateSpecificationSectionSchema.parse(request.body)
      const section = await cdService.updateSpecificationSection(
        fastify,
        sectionId,
        projectId,
        request.user.organizationId,
        input
      )
      return success(reply, section)
    }
  )

  // DELETE /construction-documents/:projectId/spec-sections/:sectionId — Admin, PM only
  fastify.delete(
    '/:projectId/spec-sections/:sectionId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { projectId, sectionId } = request.params as { projectId: string; sectionId: string }
      await cdService.deleteSpecificationSection(
        fastify,
        sectionId,
        projectId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Specification Revisions ──────────────────────────────────────────────

  // GET /construction-documents/:projectId/spec-sections/:sectionId/revisions
  fastify.get(
    '/:projectId/spec-sections/:sectionId/revisions',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { projectId, sectionId } = request.params as { projectId: string; sectionId: string }
      const revisions = await cdService.listSpecificationRevisions(
        fastify,
        sectionId,
        projectId,
        request.user.organizationId
      )
      return success(reply, revisions)
    }
  )

  // POST /construction-documents/:projectId/spec-sections/:sectionId/revisions/upload-url
  fastify.post(
    '/:projectId/spec-sections/:sectionId/revisions/upload-url',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...UPLOAD_ROLES)] },
    async (request, reply) => {
      const { projectId, sectionId } = request.params as { projectId: string; sectionId: string }
      const { fileName, mimeType, fileSize } = request.body as {
        fileName: string
        mimeType: string
        fileSize: number
      }
      const result = await cdService.getSpecificationRevisionUploadUrl(
        fastify,
        sectionId,
        projectId,
        request.user.organizationId,
        fileName,
        mimeType,
        fileSize
      )
      return success(reply, result)
    }
  )

  // POST /construction-documents/:projectId/spec-sections/:sectionId/revisions
  fastify.post(
    '/:projectId/spec-sections/:sectionId/revisions',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...UPLOAD_ROLES)] },
    async (request, reply) => {
      const { projectId, sectionId } = request.params as { projectId: string; sectionId: string }
      const input = addSpecificationRevisionSchema.parse(request.body)
      const revision = await cdService.addSpecificationRevision(
        fastify,
        sectionId,
        projectId,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, revision)
    }
  )

  // DELETE /construction-documents/:projectId/spec-sections/:sectionId/revisions/:revisionId
  fastify.delete(
    '/:projectId/spec-sections/:sectionId/revisions/:revisionId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { sectionId, revisionId } = request.params as {
        projectId: string
        sectionId: string
        revisionId: string
      }
      await cdService.deleteSpecificationRevision(
        fastify,
        revisionId,
        sectionId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )
}

export default constructionDocumentRoutes
