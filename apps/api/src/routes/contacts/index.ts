import { createContactSchema, updateContactSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import * as contactService from '../../services/contact.service'

import type { FastifyPluginAsync } from 'fastify'

const contactRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /contacts — all authenticated users
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        type?: string
        search?: string
      }
      const { contacts, meta } = await contactService.listContacts(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, contacts, meta)
    }
  )

  // GET /contacts/:id — all authenticated users
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const contact = await contactService.getContact(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, contact)
    }
  )

  // POST /contacts — Admin, ProjectManager, OfficeAdmin
  fastify.post(
    '/',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const input = createContactSchema.parse(request.body)
      const contact = await contactService.createContact(
        fastify,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, contact)
    }
  )

  // PATCH /contacts/:id — Admin, ProjectManager, OfficeAdmin
  fastify.patch(
    '/:id',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateContactSchema.parse(request.body)
      const contact = await contactService.updateContact(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, contact)
    }
  )

  // DELETE /contacts/:id — Admin only
  fastify.delete(
    '/:id',
    {
      preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await contactService.deleteContact(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // POST /contacts/:contactId/projects/:projectId — Admin, ProjectManager
  fastify.post(
    '/:contactId/projects/:projectId',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager'),
      ],
    },
    async (request, reply) => {
      const { contactId, projectId } = request.params as {
        contactId: string
        projectId: string
      }
      await contactService.addContactToProject(
        fastify,
        contactId,
        projectId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // DELETE /contacts/:contactId/projects/:projectId — Admin, ProjectManager
  fastify.delete(
    '/:contactId/projects/:projectId',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager'),
      ],
    },
    async (request, reply) => {
      const { contactId, projectId } = request.params as {
        contactId: string
        projectId: string
      }
      await contactService.removeContactFromProject(
        fastify,
        contactId,
        projectId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )
}

export default contactRoutes
