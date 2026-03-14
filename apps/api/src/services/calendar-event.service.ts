import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { ForbiddenError, NotFoundError } from '../lib/errors'

import type {
  CreateCalendarEventSchemaInput,
  UpdateCalendarEventSchemaInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  allDay: true,
  eventType: true,
  organizationId: true,
  projectId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      number: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
}

export interface ListCalendarEventsQuery {
  page?: string
  perPage?: string
  startDate?: string
  endDate?: string
  projectId?: string
}

export async function listCalendarEvents(
  fastify: FastifyInstance,
  organizationId: string,
  query: ListCalendarEventsQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)

  const dateFilter: Record<string, unknown> = {}
  if (query.startDate || query.endDate) {
    // Return events that overlap with the requested date range
    if (query.startDate) dateFilter['gte'] = new Date(query.startDate)
    if (query.endDate) dateFilter['lte'] = new Date(query.endDate)
  }

  const where = {
    organizationId,
    ...(Object.keys(dateFilter).length > 0
      ? { startDate: dateFilter }
      : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  }

  const [events, total] = await Promise.all([
    fastify.prisma.calendarEvent.findMany({
      where,
      select: EVENT_SELECT,
      orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    fastify.prisma.calendarEvent.count({ where }),
  ])

  return { events, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getCalendarEvent(
  fastify: FastifyInstance,
  eventId: string,
  organizationId: string
) {
  const event = await fastify.prisma.calendarEvent.findFirst({
    where: { id: eventId, organizationId },
    select: EVENT_SELECT,
  })

  if (!event) {
    throw new NotFoundError('Calendar event not found')
  }

  return event
}

export async function createCalendarEvent(
  fastify: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateCalendarEventSchemaInput
) {
  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  const event = await fastify.prisma.calendarEvent.create({
    data: {
      ...input,
      organizationId,
      createdById,
    },
    select: EVENT_SELECT,
  })

  return event
}

export async function updateCalendarEvent(
  fastify: FastifyInstance,
  eventId: string,
  organizationId: string,
  userId: string,
  input: UpdateCalendarEventSchemaInput
) {
  const event = await getCalendarEvent(fastify, eventId, organizationId)

  const userRoles = await fastify.prisma.userRole.findMany({
    where: { userId, role: { organizationId } },
    include: { role: true },
  })
  const roleNames = userRoles.map((ur) => ur.role.name)

  const canManage = roleNames.some((r) =>
    ['Admin', 'ProjectManager', 'OfficeAdmin', 'Superintendent'].includes(r)
  )
  const isCreator = event.createdById === userId

  if (!canManage && !isCreator) {
    throw new ForbiddenError('You do not have permission to update this event')
  }

  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  const updated = await fastify.prisma.calendarEvent.update({
    where: { id: eventId },
    data: input,
    select: EVENT_SELECT,
  })

  return updated
}

export async function deleteCalendarEvent(
  fastify: FastifyInstance,
  eventId: string,
  organizationId: string,
  userId: string
) {
  const event = await getCalendarEvent(fastify, eventId, organizationId)

  const userRoles = await fastify.prisma.userRole.findMany({
    where: { userId, role: { organizationId } },
    include: { role: true },
  })
  const roleNames = userRoles.map((ur) => ur.role.name)

  const isAdmin = roleNames.includes('Admin')
  const isCreator = event.createdById === userId

  if (!isAdmin && !isCreator) {
    throw new ForbiddenError('You do not have permission to delete this event')
  }

  await fastify.prisma.calendarEvent.delete({
    where: { id: eventId },
  })
}
