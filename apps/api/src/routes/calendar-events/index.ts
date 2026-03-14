import { createCalendarEventSchema, updateCalendarEventSchema } from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as calendarEventService from '../../services/calendar-event.service'

import type { FastifyPluginAsync } from 'fastify'

const calendarEventRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // GET /calendar-events - List events (all authenticated users)
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        startDate?: string
        endDate?: string
        projectId?: string
      }
      const { events, meta } = await calendarEventService.listCalendarEvents(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, events, meta)
    }
  )

  // GET /calendar-events/:id - Get single event (all authenticated users)
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const event = await calendarEventService.getCalendarEvent(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, event)
    }
  )

  // POST /calendar-events - Create event (Admin, PM, OfficeAdmin, Superintendent)
  fastify.post(
    '/',
    {
      preHandler: [
        writeRateLimiter,
        authenticate,
        requireRole('Admin', 'ProjectManager', 'OfficeAdmin', 'Superintendent'),
      ],
    },
    async (request, reply) => {
      const input = createCalendarEventSchema.parse(request.body)
      const event = await calendarEventService.createCalendarEvent(
        fastify,
        request.user.organizationId,
        request.user.id,
        input
      )
      return created(reply, event)
    }
  )

  // PATCH /calendar-events/:id - Update event (role or creator)
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateCalendarEventSchema.parse(request.body)
      const event = await calendarEventService.updateCalendarEvent(
        fastify,
        id,
        request.user.organizationId,
        request.user.id,
        input
      )
      return success(reply, event)
    }
  )

  // DELETE /calendar-events/:id - Delete event (Admin or creator)
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await calendarEventService.deleteCalendarEvent(
        fastify,
        id,
        request.user.organizationId,
        request.user.id
      )
      return noContent(reply)
    }
  )
}

export default calendarEventRoutes
