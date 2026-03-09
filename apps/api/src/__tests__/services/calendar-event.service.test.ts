import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
} from '../../services/calendar-event.service'
import { createMockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const EVENT_ID = 'event-1'

const mockEvent = {
  id: EVENT_ID,
  title: 'Site Inspection',
  description: null,
  startDate: new Date('2026-03-15'),
  endDate: new Date('2026-03-15'),
  allDay: true,
  eventType: 'INSPECTION',
  organizationId: ORG_ID,
  projectId: null,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: null,
  createdBy: {
    id: USER_ID,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
}

function buildMockFastify(prisma: ReturnType<typeof createMockPrisma>) {
  return { prisma } as unknown as Parameters<typeof listCalendarEvents>[0]
}

describe('listCalendarEvents', () => {
  it('returns events and pagination meta', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findMany.mockResolvedValue([mockEvent])
    prisma.calendarEvent.count.mockResolvedValue(1)

    const fastify = buildMockFastify(prisma)
    const result = await listCalendarEvents(fastify, ORG_ID, {})

    expect(result.events).toHaveLength(1)
    expect(result.meta.total).toBe(1)
    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: ORG_ID } })
    )
  })

  it('applies date range filter', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findMany.mockResolvedValue([])
    prisma.calendarEvent.count.mockResolvedValue(0)

    const fastify = buildMockFastify(prisma)
    await listCalendarEvents(fastify, ORG_ID, {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    })

    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDate: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }),
        }),
      })
    )
  })

  it('applies projectId filter', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findMany.mockResolvedValue([])
    prisma.calendarEvent.count.mockResolvedValue(0)

    const fastify = buildMockFastify(prisma)
    await listCalendarEvents(fastify, ORG_ID, { projectId: 'proj-1' })

    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'proj-1' }),
      })
    )
  })
})

describe('getCalendarEvent', () => {
  it('returns event when found', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(mockEvent)

    const fastify = buildMockFastify(prisma)
    const result = await getCalendarEvent(fastify, EVENT_ID, ORG_ID)

    expect(result.id).toBe(EVENT_ID)
    expect(prisma.calendarEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: EVENT_ID, organizationId: ORG_ID } })
    )
  })

  it('throws NotFoundError when event does not exist', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(null)

    const fastify = buildMockFastify(prisma)
    await expect(getCalendarEvent(fastify, 'bad-id', ORG_ID)).rejects.toMatchObject({
      message: 'Calendar event not found',
    })
  })
})

describe('createCalendarEvent', () => {
  const input = {
    title: 'Team Meeting',
    startDate: new Date('2026-03-15'),
    endDate: new Date('2026-03-15'),
    allDay: false,
    eventType: 'MEETING' as const,
  }

  it('creates and returns the event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.create.mockResolvedValue({ ...mockEvent, ...input })

    const fastify = buildMockFastify(prisma)
    const result = await createCalendarEvent(fastify, ORG_ID, USER_ID, input)

    expect(prisma.calendarEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Team Meeting',
          organizationId: ORG_ID,
          createdById: USER_ID,
        }),
      })
    )
    expect(result.title).toBe('Team Meeting')
  })

  it('validates projectId belongs to org when provided', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(null)

    const fastify = buildMockFastify(prisma)
    await expect(
      createCalendarEvent(fastify, ORG_ID, USER_ID, { ...input, projectId: 'bad-proj' })
    ).rejects.toMatchObject({ message: 'Project not found' })
  })
})

describe('updateCalendarEvent', () => {
  it('allows Admin to update any event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(mockEvent)
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.update.mockResolvedValue({ ...mockEvent, title: 'Updated' })

    const fastify = buildMockFastify(prisma)
    const result = await updateCalendarEvent(fastify, EVENT_ID, ORG_ID, 'other-user', {
      title: 'Updated',
    })

    expect(result.title).toBe('Updated')
  })

  it('allows creator to update their own event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({ ...mockEvent, createdById: USER_ID })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.update.mockResolvedValue({ ...mockEvent, title: 'Updated by creator' })

    const fastify = buildMockFastify(prisma)
    const result = await updateCalendarEvent(fastify, EVENT_ID, ORG_ID, USER_ID, {
      title: 'Updated by creator',
    })

    expect(result.title).toBe('Updated by creator')
  })

  it('throws ForbiddenError when non-creator low-privilege user tries to update', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({ ...mockEvent, createdById: 'other-user' })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])

    const fastify = buildMockFastify(prisma)
    await expect(
      updateCalendarEvent(fastify, EVENT_ID, ORG_ID, USER_ID, { title: 'Hack' })
    ).rejects.toMatchObject({ message: 'You do not have permission to update this event' })
  })
})

describe('deleteCalendarEvent', () => {
  it('allows Admin to delete any event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({ ...mockEvent, createdById: 'other-user' })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.delete.mockResolvedValue(mockEvent)

    const fastify = buildMockFastify(prisma)
    await deleteCalendarEvent(fastify, EVENT_ID, ORG_ID, USER_ID)

    expect(prisma.calendarEvent.delete).toHaveBeenCalledWith({ where: { id: EVENT_ID } })
  })

  it('allows creator to delete their own event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({ ...mockEvent, createdById: USER_ID })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.delete.mockResolvedValue(mockEvent)

    const fastify = buildMockFastify(prisma)
    await deleteCalendarEvent(fastify, EVENT_ID, ORG_ID, USER_ID)

    expect(prisma.calendarEvent.delete).toHaveBeenCalledWith({ where: { id: EVENT_ID } })
  })

  it('throws ForbiddenError when non-admin non-creator tries to delete', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({ ...mockEvent, createdById: 'other-user' })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])

    const fastify = buildMockFastify(prisma)
    await expect(
      deleteCalendarEvent(fastify, EVENT_ID, ORG_ID, USER_ID)
    ).rejects.toMatchObject({ message: 'You do not have permission to delete this event' })
  })
})
