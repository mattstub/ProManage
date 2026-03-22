import { describe, it, expect } from 'vitest'

import { buildJobSafetyTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const PROJECT_ID = 'proj-1'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
const mockProject = { id: PROJECT_ID, name: 'Test Project', number: 'P-001' }

const mockJha = {
  id: 'jha-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  title: 'Excavation JHA',
  description: 'Hazards for open trench work',
  status: 'ACTIVE',
  fileKey: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  createdById: USER_ID,
  createdBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockEmergencyContact = {
  id: 'ec-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  name: 'City Hospital',
  role: 'HOSPITAL',
  phone: '555-0100',
  address: '100 Main St',
  notes: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSdsEntry = {
  id: 'sds-1',
  organizationId: ORG_ID,
  productName: 'PVC Primer',
  manufacturer: 'Oatey',
  chemicalName: 'THF',
  sdsFileKey: null,
  sdsFileName: null,
  reviewDate: null,
  notes: null,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockProjectSdsEntry = {
  id: 'pse-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  sdsEntryId: 'sds-1',
  notes: null,
  addedAt: new Date(),
  sdsEntry: mockSdsEntry,
}

const mockSafetyDoc = {
  id: 'doc-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  title: 'Site Safety Plan',
  description: null,
  category: 'POLICY',
  fileName: 'plan.pdf',
  fileKey: 'safety/plan.pdf',
  fileSize: 204800,
  mimeType: 'application/pdf',
  uploadedById: USER_ID,
  uploadedBy: mockUser,
  project: mockProject,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockToolboxTalk = {
  id: 'talk-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  title: 'Ladder Safety',
  content: null,
  scheduledDate: null,
  conductedDate: null,
  status: 'SCHEDULED',
  conductedById: null,
  createdById: USER_ID,
  conductedBy: null,
  createdBy: mockUser,
  attendees: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockIncident = {
  id: 'incident-1',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  title: 'Near-Miss',
  incidentType: 'NEAR_MISS',
  incidentDate: new Date(),
  location: null,
  description: 'Tool slipped.',
  correctiveAction: null,
  status: 'OPEN',
  reportedById: USER_ID,
  reportedBy: mockUser,
  project: mockProject,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildApp(prisma?: MockPrisma) {
  return buildJobSafetyTestApp(prisma)
}

function adminToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'admin@example.com', organizationId: ORG_ID })
}

function fieldToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'field@example.com', organizationId: ORG_ID })
}

function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as any)
}

const BASE = `/api/v1/projects/${PROJECT_ID}/safety`

// ─── JHA Tests ────────────────────────────────────────────────────────────────

describe(`GET ${BASE}/jhas`, () => {
  it('returns 200 with JHA list for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.jobHazardAnalysis.findMany.mockResolvedValue([mockJha])
    prisma.jobHazardAnalysis.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/jhas`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Excavation JHA')
  })

  it('returns 401 without token', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: `${BASE}/jhas` })
    expect(res.statusCode).toBe(401)
  })

  it('returns 404 when project not found', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/jhas`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe(`GET ${BASE}/jhas/:id`, () => {
  it('returns 200 for a found JHA', async () => {
    const prisma = createMockPrisma()
    prisma.jobHazardAnalysis.findFirst.mockResolvedValue(mockJha)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/jhas/jha-1`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('jha-1')
  })

  it('returns 404 when JHA not found', async () => {
    const prisma = createMockPrisma()
    prisma.jobHazardAnalysis.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/jhas/missing`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe(`POST ${BASE}/jhas`, () => {
  it('returns 201 when Admin creates a JHA', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.jobHazardAnalysis.create.mockResolvedValue(mockJha)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/jhas`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { title: 'Excavation JHA', description: 'Open trench work' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.title).toBe('Excavation JHA')
  })

  it('returns 403 when FieldUser attempts to create', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    prisma.project.findFirst.mockResolvedValue(mockProject)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/jhas`,
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      payload: { title: 'Test JHA' },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 422 with missing required fields', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/jhas`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
  })
})

describe(`PATCH ${BASE}/jhas/:id`, () => {
  it('returns 200 when updating a JHA', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.jobHazardAnalysis.findFirst.mockResolvedValue(mockJha)
    prisma.jobHazardAnalysis.update.mockResolvedValue({ ...mockJha, status: 'ARCHIVED' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: `${BASE}/jhas/jha-1`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { status: 'ARCHIVED' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('ARCHIVED')
  })
})

describe(`DELETE ${BASE}/jhas/:id`, () => {
  it('returns 204 when Admin deletes a JHA', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.jobHazardAnalysis.findFirst.mockResolvedValue(mockJha)
    prisma.jobHazardAnalysis.delete.mockResolvedValue(mockJha)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `${BASE}/jhas/jha-1`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 when FieldUser attempts to delete', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `${BASE}/jhas/jha-1`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

// ─── Emergency Contact Tests ──────────────────────────────────────────────────

describe(`GET ${BASE}/emergency-contacts`, () => {
  it('returns 200 with emergency contacts list', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.projectEmergencyContact.findMany.mockResolvedValue([mockEmergencyContact])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/emergency-contacts`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('City Hospital')
  })

  it('returns 401 without token', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: `${BASE}/emergency-contacts` })
    expect(res.statusCode).toBe(401)
  })
})

describe(`POST ${BASE}/emergency-contacts`, () => {
  it('returns 201 when Admin creates an emergency contact', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.projectEmergencyContact.create.mockResolvedValue(mockEmergencyContact)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/emergency-contacts`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { name: 'City Hospital', role: 'HOSPITAL', phone: '555-0100' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.role).toBe('HOSPITAL')
  })

  it('returns 422 with missing required phone field', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/emergency-contacts`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { name: 'City Hospital' },
    })
    expect(res.statusCode).toBe(400)
  })
})

describe(`PATCH ${BASE}/emergency-contacts/:id`, () => {
  it('returns 200 when updating contact', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.projectEmergencyContact.findFirst.mockResolvedValue(mockEmergencyContact)
    prisma.projectEmergencyContact.update.mockResolvedValue({ ...mockEmergencyContact, phone: '555-9999' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: `${BASE}/emergency-contacts/ec-1`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { phone: '555-9999' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.phone).toBe('555-9999')
  })
})

describe(`DELETE ${BASE}/emergency-contacts/:id`, () => {
  it('returns 204 when Admin deletes a contact', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.projectEmergencyContact.findFirst.mockResolvedValue(mockEmergencyContact)
    prisma.projectEmergencyContact.delete.mockResolvedValue(mockEmergencyContact)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `${BASE}/emergency-contacts/ec-1`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })
})

// ─── Project SDS Binder Tests ─────────────────────────────────────────────────

describe(`GET ${BASE}/sds`, () => {
  it('returns 200 with project SDS entries', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.projectSdsEntry.findMany.mockResolvedValue([mockProjectSdsEntry])
    prisma.projectSdsEntry.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/sds`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].sdsEntry.productName).toBe('PVC Primer')
  })
})

describe(`POST ${BASE}/sds`, () => {
  it('returns 201 when PM adds an SDS entry to the binder', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
    prisma.projectSdsEntry.findUnique.mockResolvedValue(null)
    prisma.projectSdsEntry.create.mockResolvedValue(mockProjectSdsEntry)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/sds`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { sdsEntryId: 'sds-1' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.sdsEntry.productName).toBe('PVC Primer')
  })

  it('returns 409 when SDS entry already in binder', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
    prisma.projectSdsEntry.findUnique.mockResolvedValue(mockProjectSdsEntry)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `${BASE}/sds`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { sdsEntryId: 'sds-1' },
    })
    expect(res.statusCode).toBe(409)
  })
})

describe(`DELETE ${BASE}/sds/:id`, () => {
  it('returns 204 when removing an SDS entry from binder', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.projectSdsEntry.findFirst.mockResolvedValue(mockProjectSdsEntry)
    prisma.projectSdsEntry.delete.mockResolvedValue(mockProjectSdsEntry)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `${BASE}/sds/pse-1`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })
})

// ─── Project-scoped safety read views ─────────────────────────────────────────

describe(`GET ${BASE}/documents`, () => {
  it('returns 200 with project-scoped safety documents', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.safetyDocument.findMany.mockResolvedValue([mockSafetyDoc])
    prisma.safetyDocument.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/documents`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].title).toBe('Site Safety Plan')
  })
})

describe(`GET ${BASE}/toolbox-talks`, () => {
  it('returns 200 with project toolbox talks', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.toolboxTalk.findMany.mockResolvedValue([mockToolboxTalk])
    prisma.toolboxTalk.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/toolbox-talks`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].title).toBe('Ladder Safety')
  })
})

describe(`GET ${BASE}/incidents`, () => {
  it('returns 200 with project incident reports', async () => {
    const prisma = createMockPrisma()
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.incidentReport.findMany.mockResolvedValue([mockIncident])
    prisma.incidentReport.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `${BASE}/incidents`,
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].incidentType).toBe('NEAR_MISS')
  })
})
