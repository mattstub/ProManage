import {
  createLicenseSchema,
  updateLicenseSchema,
  createLicenseReminderSchema,
  updateLicenseReminderSchema,
  MINIO_BUCKET_NAME,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as licenseService from '../../services/license.service'

import type { FastifyPluginAsync } from 'fastify'

const licenseRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Licenses ────────────────────────────────────────────────────────────────

  // GET /licenses — all authenticated users
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        search?: string
        holderType?: string
        status?: string
        userId?: string
      }
      const { licenses, pagination } = await licenseService.listLicenses(
        fastify,
        request.user.organizationId,
        {
          page: query.page ? parseInt(query.page, 10) : undefined,
          limit: query.perPage ? parseInt(query.perPage, 10) : undefined,
          search: query.search,
          holderType: query.holderType,
          status: query.status,
          userId: query.userId,
        }
      )
      return paginated(reply, licenses, pagination)
    }
  )

  // GET /licenses/:id — all authenticated users
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const license = await licenseService.getLicense(fastify, id, request.user.organizationId)
      return success(reply, license)
    }
  )

  // POST /licenses — Admin, OfficeAdmin
  fastify.post(
    '/',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const input = createLicenseSchema.parse(request.body)
      const license = await licenseService.createLicense(
        fastify,
        request.user.organizationId,
        input,
        request.user.id
      )
      return created(reply, license)
    }
  )

  // PATCH /licenses/:id — Admin, OfficeAdmin
  fastify.patch(
    '/:id',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateLicenseSchema.parse(request.body)
      const license = await licenseService.updateLicense(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, license)
    }
  )

  // DELETE /licenses/:id — Admin only
  fastify.delete(
    '/:id',
    {
      preHandler: [
        sensitiveRateLimiter,
        authenticate,
        requireRole('Admin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await licenseService.deleteLicense(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Documents ───────────────────────────────────────────────────────────────

  // POST /licenses/:id/documents/upload-url — request presigned upload URL
  fastify.post(
    '/:id/documents/upload-url',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { fileName, mimeType, fileSize } = request.body as {
        fileName: string
        mimeType: string
        fileSize: number
      }
      // Verify license exists and belongs to org
      await licenseService.getLicense(fastify, id, request.user.organizationId)

      const fileKey = `licenses/${id}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, fileKey, 900) // 15min

      return success(reply, { uploadUrl, fileKey, fileName, mimeType, fileSize })
    }
  )

  // POST /licenses/:id/documents — confirm upload and create DB record
  fastify.post(
    '/:id/documents',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { fileName, fileKey, fileSize, mimeType, documentTag } = request.body as {
        fileName: string
        fileKey: string
        fileSize: number
        mimeType: string
        documentTag?: string
      }

      const endpoint = process.env['MINIO_ENDPOINT'] ?? 'localhost'
      const port = process.env['MINIO_PORT'] ?? '9000'
      const protocol = process.env['MINIO_USE_SSL'] === 'true' ? 'https' : 'http'
      const fileUrl = `${protocol}://${endpoint}:${port}/${MINIO_BUCKET_NAME}/${fileKey}`

      const doc = await licenseService.addLicenseDocument(
        fastify,
        id,
        request.user.organizationId,
        { fileName, fileKey, fileUrl, fileSize, mimeType, documentTag },
        request.user.id
      )
      return created(reply, doc)
    }
  )

  // DELETE /licenses/:id/documents/:docId — Admin, OfficeAdmin
  fastify.delete(
    '/:id/documents/:docId',
    {
      preHandler: [
        sensitiveRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      await licenseService.deleteLicenseDocument(
        fastify,
        docId,
        id,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // GET /licenses/:id/documents/:docId/download-url — all authenticated
  fastify.get(
    '/:id/documents/:docId/download-url',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id, docId } = request.params as { id: string; docId: string }
      const doc = await fastify.prisma.licenseDocument.findFirst({
        where: { id: docId, licenseId: id, license: { organizationId: request.user.organizationId } },
      })
      if (!doc) {
        return reply.status(404).send({ error: 'Document not found' })
      }
      const downloadUrl = await fastify.minio.presignedGetObject(MINIO_BUCKET_NAME, doc.fileKey, 900)
      return success(reply, { downloadUrl, fileName: doc.fileName })
    }
  )

  // ─── Reminders ───────────────────────────────────────────────────────────────

  // POST /licenses/:id/reminders — Admin, OfficeAdmin, ProjectManager
  fastify.post(
    '/:id/reminders',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin', 'ProjectManager'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = createLicenseReminderSchema.parse(request.body)
      const reminder = await licenseService.createReminder(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return created(reply, reminder)
    }
  )

  // PATCH /licenses/:id/reminders/:reminderId — Admin, OfficeAdmin, ProjectManager
  fastify.patch(
    '/:id/reminders/:reminderId',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin', 'ProjectManager'),
      ],
    },
    async (request, reply) => {
      const { id, reminderId } = request.params as { id: string; reminderId: string }
      const input = updateLicenseReminderSchema.parse(request.body)
      const reminder = await licenseService.updateReminder(
        fastify,
        reminderId,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, reminder)
    }
  )

  // DELETE /licenses/:id/reminders/:reminderId — Admin, OfficeAdmin, ProjectManager
  fastify.delete(
    '/:id/reminders/:reminderId',
    {
      preHandler: [
        sensitiveRateLimiter,
        authenticate,
        requireRole('Admin', 'OfficeAdmin', 'ProjectManager'),
      ],
    },
    async (request, reply) => {
      const { id, reminderId } = request.params as { id: string; reminderId: string }
      await licenseService.deleteReminder(
        fastify,
        reminderId,
        id,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )
}

export default licenseRoutes
