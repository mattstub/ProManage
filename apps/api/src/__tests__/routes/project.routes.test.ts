import { describe, it, expect, vi, beforeEach } from 'vitest'

import { buildProjectTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const baseProject = {
  id: 'project-1',
  name: 'Downtown Office Renovation',
  number: 'PRJ-2026-001',
  type: 'Commercial',
  status: 'Active',
  description: null,
  address: null,
  startDate: null,
  endDate: null,
  ownerName: null,
  ownerPhone: null,
  ownerEmail: null,
  architectName: null,
  contractorLicense: null,
  permitNumber: null,
  budget: null,
  squareFootage: null,
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  scopes: [],
  settings: null,
  contactProjects: [],
  _count: { tasks: 0, incidentReports: 0, toolboxTalks: 0, channels: 0 },
}

const baseScope = {
  id: 'scope-1',
  name: 'Phase 1',
  description: null,
  status: 'Active',
  sequence: 0,
  startDate: null,
  endDate: null,
  budget: null,
  projectId: 'project-1',
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const baseSettings = {
  id: 'settings-1',
  projectId: 'project-1',
  requireDailyReports: false,
  requireTimeTracking: false,
  enableSafetyModule: true,
  enableDocumentsModule: false,
  defaultView: 'dashboard',
  notifyOnIncident: true,
  notifyOnDailyReport: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function adminToken(
  app: Awaited<ReturnType<typeof buildProjectTestApp>>['app'],
  role = 'Admin'
) {
  return signTestToken(app, {
    sub: 'user-1',
    email: 'admin@demo.com',
    organizationId: 'org-1',
    roles: [role],
  })
}

/** Seed the mock so requireRole() returns the given role name. */
function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as any)
}

// ─── GET /projects ────────────────────────────────────────────────────────────

describe('GET /api/v1/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with paginated list when authenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findMany.mockResolvedValue([baseProject])
    prisma.project.count.mockResolvedValue(1)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta.total).toBe(1)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildProjectTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('filters by status query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?status=Active',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Active' }),
      })
    )
    await app.close()
  })

  it('filters by type query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?type=Commercial',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'Commercial' }),
      })
    )
    await app.close()
  })

  it('applies search query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?search=downtown',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    )
    await app.close()
  })
})

// ─── GET /projects/:id ────────────────────────────────────────────────────────

describe('GET /api/v1/projects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with project with relations', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(baseProject)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.id).toBe('project-1')
    expect(body.data.scopes).toEqual([])
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildProjectTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects/project-1' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── POST /projects ───────────────────────────────────────────────────────────

describe('POST /api/v1/projects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findUnique.mockResolvedValue(null)
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma)
    )
    prisma.project.create.mockResolvedValue({ id: 'project-new' })
    prisma.projectSettings.create.mockResolvedValue(baseSettings)
    prisma.project.findFirst.mockResolvedValue(baseProject)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken(app, 'Admin')}` },
      payload: { name: 'New Project', number: 'PRJ-NEW', type: 'Commercial' },
    })

    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('returns 201 with ProjectManager role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'ProjectManager')
    prisma.project.findUnique.mockResolvedValue(null)
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma)
    )
    prisma.project.create.mockResolvedValue({ id: 'project-new' })
    prisma.projectSettings.create.mockResolvedValue(baseSettings)
    prisma.project.findFirst.mockResolvedValue(baseProject)

    const token = signTestToken(app, {
      sub: 'user-2',
      email: 'pm@demo.com',
      organizationId: 'org-1',
      roles: ['ProjectManager'],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'PM Project', number: 'PRJ-PM', type: 'Residential' },
    })

    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('returns 403 with Superintendent role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Superintendent')
    const token = signTestToken(app, {
      sub: 'user-3',
      email: 'sup@demo.com',
      organizationId: 'org-1',
      roles: ['Superintendent'],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Blocked', number: 'PRJ-BLOCKED', type: 'Commercial' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Blocked', number: 'PRJ-BLOCKED', type: 'Commercial' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildProjectTestApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      payload: { name: 'X', number: 'PRJ-X', type: 'Commercial' },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when name is missing', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { number: 'PRJ-X', type: 'Commercial' },
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 409 when project number already exists', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findUnique.mockResolvedValue(baseProject)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'Dupe', number: 'PRJ-2026-001', type: 'Commercial' },
    })

    expect(res.statusCode).toBe(409)
    await app.close()
  })
})

// ─── PATCH /projects/:id ──────────────────────────────────────────────────────

describe('PATCH /api/v1/projects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on successful update with Admin', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.project.update.mockResolvedValue(baseProject)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'Updated Name' },
    })

    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'X' },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── DELETE /projects/:id ─────────────────────────────────────────────────────

describe('DELETE /api/v1/projects/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 with Admin role (archives)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.project.update.mockResolvedValue({ ...baseProject, status: 'Closed' })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 with ProjectManager role (Admin only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'ProjectManager')
    const token = signTestToken(app, {
      sub: 'user-2',
      email: 'pm@demo.com',
      organizationId: 'org-1',
      roles: ['ProjectManager'],
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── GET /projects/:id/dashboard ─────────────────────────────────────────────

describe('GET /api/v1/projects/:id/dashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with dashboard metrics', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.task.count.mockResolvedValue(0)
    prisma.incidentReport.count.mockResolvedValue(0)
    prisma.calendarEvent.count.mockResolvedValue(0)
    prisma.toolboxTalk.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1/dashboard',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('project')
    expect(body.data).toHaveProperty('metrics')
    expect(body.data.metrics).toHaveProperty('openTaskCount')
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildProjectTestApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects/project-1/dashboard' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/missing/dashboard',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── GET /projects/:id/contacts ───────────────────────────────────────────────

describe('GET /api/v1/projects/:id/contacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with contact assignments', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.contactProject.findMany.mockResolvedValue([
      {
        assignedAt: new Date(),
        role: 'Electrician',
        contact: {
          id: 'c-1',
          firstName: 'Bob',
          lastName: 'Builder',
          company: null,
          type: 'SUBCONTRACTOR',
          email: null,
          phone: null,
          mobile: null,
          title: null,
        },
      },
    ])

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1/contacts',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].role).toBe('Electrician')
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildProjectTestApp()
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1/contacts',
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/missing/contacts',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── POST /projects/:id/contacts/:contactId ───────────────────────────────────

describe('POST /api/v1/projects/:id/contacts/:contactId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when Admin assigns contact', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' })
    prisma.contactProject.upsert.mockResolvedValue({})

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/contacts/contact-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { role: 'Electrician' },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 with OfficeAdmin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'OfficeAdmin')
    const token = signTestToken(app, {
      sub: 'user-5',
      email: 'office@demo.com',
      organizationId: 'org-1',
      roles: ['OfficeAdmin'],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {},
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/missing/contacts/contact-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: {},
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 404 when contact not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/contacts/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: {},
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── DELETE /projects/:id/contacts/:contactId ─────────────────────────────────

describe('DELETE /api/v1/projects/:id/contacts/:contactId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when Admin removes contact', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' })
    prisma.contactProject.delete.mockResolvedValue({})

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1/contacts/contact-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })
})

// ─── Scope routes ─────────────────────────────────────────────────────────────

describe('POST /api/v1/projects/:id/scopes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectScope.create.mockResolvedValue(baseScope)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/scopes',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'Phase 1', status: 'Active', sequence: 0 },
    })

    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('returns 400 when name is missing', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/scopes',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { status: 'Active' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/project-1/scopes',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Blocked', status: 'Active', sequence: 0 },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects/missing/scopes',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'Phase 1', status: 'Active', sequence: 0 },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('PATCH /api/v1/projects/:id/scopes/:scopeId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on scope update', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.projectScope.findFirst.mockResolvedValue(baseScope)
    prisma.projectScope.update.mockResolvedValue({ ...baseScope, name: 'Updated' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/scopes/scope-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it('returns 404 when scope not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.projectScope.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/scopes/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { name: 'X' },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/scopes/scope-1',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Blocked' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })
})

describe('DELETE /api/v1/projects/:id/scopes/:scopeId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on scope delete', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.projectScope.findFirst.mockResolvedValue(baseScope)
    prisma.projectScope.delete.mockResolvedValue(baseScope)

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1/scopes/scope-1',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 404 when scope not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.projectScope.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/projects/project-1/scopes/missing',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

// ─── Settings routes ──────────────────────────────────────────────────────────

describe('GET /api/v1/projects/:id/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with settings for Admin', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectSettings.upsert.mockResolvedValue(baseSettings)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1/settings',
      headers: { authorization: `Bearer ${adminToken(app)}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.enableSafetyModule).toBe(true)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/project-1/settings',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })
})

describe('PATCH /api/v1/projects/:id/settings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on successful settings update', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectSettings.upsert.mockResolvedValue({
      ...baseSettings,
      requireDailyReports: true,
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/settings',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { requireDailyReports: true },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.requireDailyReports).toBe(true)
    await app.close()
  })

  it('returns 403 with FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'FieldUser')
    const token = signTestToken(app, {
      sub: 'user-4',
      email: 'field@demo.com',
      organizationId: 'org-1',
      roles: ['FieldUser'],
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/settings',
      headers: { authorization: `Bearer ${token}` },
      payload: { requireDailyReports: true },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 400 for invalid defaultView enum', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildProjectTestApp(prisma)
    mockRole(prisma, 'Admin')

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/project-1/settings',
      headers: { authorization: `Bearer ${adminToken(app)}` },
      payload: { defaultView: 'invalid-view' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})
