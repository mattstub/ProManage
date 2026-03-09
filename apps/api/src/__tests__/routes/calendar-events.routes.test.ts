import { describe, it, expect, beforeEach } from 'vitest'

import { buildCalendarEventTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-admin'
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
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
  },
}

describe('GET /api/v1/calendar-events', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildCalendarEventTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/calendar-events' })
    expect(res.statusCode).toBe(401)
  })

  it('returns paginated events for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findMany.mockResolvedValue([mockEvent])
    prisma.calendarEvent.count.mockResolvedValue(1)

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
      roles: ['Admin'],
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/calendar-events',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Site Inspection')
    expect(body.meta).toBeDefined()
  })
})

describe('GET /api/v1/calendar-events/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildCalendarEventTestApp()
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns event for authenticated user', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(mockEvent)

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.title).toBe('Site Inspection')
  })

  it('returns 404 for unknown event', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(null)

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/calendar-events/bad-id',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/v1/calendar-events', () => {
  const validBody = {
    title: 'Kickoff Meeting',
    startDate: '2026-03-20',
    endDate: '2026-03-20',
    eventType: 'MEETING',
    allDay: true,
  }

  it('returns 401 when not authenticated', async () => {
    const { app } = await buildCalendarEventTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/calendar-events',
      payload: validBody,
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 403 for FieldUser (insufficient role)', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'field@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/calendar-events',
      headers: { Authorization: `Bearer ${token}` },
      payload: validBody,
    })

    expect(res.statusCode).toBe(403)
  })

  it('creates event for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.create.mockResolvedValue({ ...mockEvent, title: 'Kickoff Meeting' })

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/calendar-events',
      headers: { Authorization: `Bearer ${token}` },
      payload: validBody,
    })

    expect(res.statusCode).toBe(201)
    const body = JSON.parse(res.body)
    expect(body.data.title).toBe('Kickoff Meeting')
  })

  it('creates event for ProjectManager', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'ProjectManager', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.create.mockResolvedValue(mockEvent)

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'pm@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/calendar-events',
      headers: { Authorization: `Bearer ${token}` },
      payload: validBody,
    })

    expect(res.statusCode).toBe(201)
  })

  it('returns 400 for invalid body (missing title)', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/calendar-events',
      headers: { Authorization: `Bearer ${token}` },
      payload: { startDate: '2026-03-20', endDate: '2026-03-20' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/calendar-events/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildCalendarEventTestApp()
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
      payload: { title: 'Updated' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('updates event when authorized', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(mockEvent)
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.update.mockResolvedValue({ ...mockEvent, title: 'Updated' })

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
      roles: ['Admin'],
    })

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
      headers: { Authorization: `Bearer ${token}` },
      payload: { title: 'Updated' },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.data.title).toBe('Updated')
  })
})

describe('DELETE /api/v1/calendar-events/:id', () => {
  it('returns 401 when not authenticated', async () => {
    const { app } = await buildCalendarEventTestApp()
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
    })
    expect(res.statusCode).toBe(401)
  })

  it('deletes event when authorized', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue(mockEvent)
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin', organizationId: ORG_ID } },
    ])
    prisma.calendarEvent.delete.mockResolvedValue(mockEvent)

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'admin@example.com',
      organizationId: ORG_ID,
      roles: ['Admin'],
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 403 when non-admin non-creator tries to delete', async () => {
    const prisma = createMockPrisma()
    prisma.calendarEvent.findFirst.mockResolvedValue({
      ...mockEvent,
      createdById: 'other-user',
    })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser', organizationId: ORG_ID } },
    ])

    const { app } = await buildCalendarEventTestApp(prisma)
    const token = signTestToken(app, {
      sub: USER_ID,
      email: 'field@example.com',
      organizationId: ORG_ID,
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/calendar-events/${EVENT_ID}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
  })
})
