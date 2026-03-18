import { describe, it, expect, vi } from 'vitest'

import { buildSafetyTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const USER_ID = 'user-1'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }

const mockSafetyDoc = {
  id: 'doc-1',
  organizationId: ORG_ID,
  title: 'Fall Protection Policy',
  description: null,
  category: 'POLICY',
  fileName: 'fall-protection.pdf',
  fileKey: 'safety/documents/fall-protection.pdf',
  fileSize: 204800,
  mimeType: 'application/pdf',
  uploadedById: USER_ID,
  uploadedBy: mockUser,
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
  createdBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTalk = {
  id: 'talk-1',
  organizationId: ORG_ID,
  title: 'Ladder Safety',
  content: 'Review proper ladder use.',
  scheduledDate: new Date(),
  conductedDate: null,
  status: 'SCHEDULED',
  projectId: null,
  conductedById: null,
  createdById: USER_ID,
  project: null,
  conductedBy: null,
  createdBy: mockUser,
  attendees: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockAttendee = {
  id: 'attendee-1',
  talkId: 'talk-1',
  userId: USER_ID,
  name: 'Jane Doe',
  signedAt: null,
  createdAt: new Date(),
  user: mockUser,
}

const mockForm = {
  id: 'form-1',
  organizationId: ORG_ID,
  title: 'Daily Inspection',
  description: null,
  category: 'INSPECTION',
  content: '1. Check site',
  isActive: true,
  createdById: USER_ID,
  createdBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockIncident = {
  id: 'incident-1',
  organizationId: ORG_ID,
  title: 'Near-Miss: Tool Drop',
  incidentType: 'NEAR_MISS',
  incidentDate: new Date(),
  location: 'Level 3',
  description: 'A hammer fell.',
  correctiveAction: null,
  status: 'OPEN',
  projectId: null,
  reportedById: USER_ID,
  project: null,
  reportedBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildApp(prisma?: MockPrisma) {
  return buildSafetyTestApp(prisma)
}

function adminToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'admin@example.com', organizationId: ORG_ID })
}

function fieldToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'field@example.com', organizationId: ORG_ID })
}

/** Seed the mock so requireRole() returns the given role name. */
function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as any)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/safety/documents', () => {
  it('returns 200 for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.safetyDocument.findMany.mockResolvedValue([mockSafetyDoc])
    prisma.safetyDocument.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/documents',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Fall Protection Policy')
  })

  it('returns 401 without token', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/safety/documents' })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/v1/safety/documents/:id', () => {
  it('returns 200 for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/documents/doc-1',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('doc-1')
  })

  it('returns 404 when not found', async () => {
    const prisma = createMockPrisma()
    prisma.safetyDocument.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/documents/missing',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/v1/safety/documents/upload-url', () => {
  it('returns presigned URL for write-role users', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app, minio } = await buildApp(prisma)
    minio.presignedPutObject.mockResolvedValue('https://minio.local/presigned')
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/documents/upload-url',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'policy.pdf', mimeType: 'application/pdf', fileSize: 1024 }),
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.uploadUrl).toBe('https://minio.local/presigned')
    expect(body.data.fileKey).toMatch(/^safety\/documents\//)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/documents/upload-url',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'policy.pdf', mimeType: 'application/pdf', fileSize: 1024 }),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 400 for unsupported MIME type', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/documents/upload-url',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ fileName: 'script.sh', mimeType: 'application/x-sh', fileSize: 512 }),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/v1/safety/documents', () => {
  it('creates a document and returns 201', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyDocument.create.mockResolvedValue(mockSafetyDoc)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/documents',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Fall Protection Policy',
        fileKey: 'safety/documents/fall-protection.pdf',
        fileName: 'fall-protection.pdf',
        fileSize: 204800,
        mimeType: 'application/pdf',
      }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 400 for invalid fileKey prefix', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/documents',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Malicious Doc',
        fileKey: 'licenses/evil/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      }),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/safety/documents/:id', () => {
  it('updates and returns 200', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
    prisma.safetyDocument.update.mockResolvedValue({ ...mockSafetyDoc, title: 'Updated' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/documents/doc-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.title).toBe('Updated')
  })
})

describe('DELETE /api/v1/safety/documents/:id', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
    prisma.safetyDocument.delete.mockResolvedValue(mockSafetyDoc)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/documents/doc-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/documents/doc-1',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

// ─── SDS Routes ───────────────────────────────────────────────────────────────

describe('GET /api/v1/safety/sds', () => {
  it('returns 200 for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.sdsEntry.findMany.mockResolvedValue([mockSdsEntry])
    prisma.sdsEntry.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/sds',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].productName).toBe('PVC Primer')
  })
})

describe('POST /api/v1/safety/sds', () => {
  it('creates an SDS entry and returns 201', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.sdsEntry.create.mockResolvedValue(mockSdsEntry)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/sds',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'PVC Primer', manufacturer: 'Oatey' }),
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.productName).toBe('PVC Primer')
  })

  it('returns 400 with invalid sdsFileKey prefix', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/sds',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ productName: 'PVC Primer', sdsFileKey: 'evil/path/file.pdf', sdsFileName: 'file.pdf' }),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/safety/sds/:id', () => {
  it('returns 200 after update', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
    prisma.sdsEntry.update.mockResolvedValue({ ...mockSdsEntry, manufacturer: 'New Co' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/sds/sds-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ manufacturer: 'New Co' }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('DELETE /api/v1/safety/sds/:id', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
    prisma.sdsEntry.delete.mockResolvedValue(mockSdsEntry)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/sds/sds-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })
})

// ─── Toolbox Talk Routes ──────────────────────────────────────────────────────

describe('GET /api/v1/safety/toolbox-talks', () => {
  it('returns 200 for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.toolboxTalk.findMany.mockResolvedValue([mockTalk])
    prisma.toolboxTalk.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/toolbox-talks',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].title).toBe('Ladder Safety')
  })
})

describe('POST /api/v1/safety/toolbox-talks', () => {
  it('creates a talk and returns 201', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.toolboxTalk.create.mockResolvedValue(mockTalk)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/toolbox-talks',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Ladder Safety' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 400 for missing title', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/toolbox-talks',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/safety/toolbox-talks/:id', () => {
  it('returns 200 after update', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
    prisma.toolboxTalk.update.mockResolvedValue({ ...mockTalk, status: 'COMPLETED' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/toolbox-talks/talk-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('POST /api/v1/safety/toolbox-talks/:id/attendees', () => {
  it('adds an attendee and returns 201', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
    prisma.toolboxTalkAttendee.create.mockResolvedValue(mockAttendee)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/toolbox-talks/talk-1/attendees',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Jane Doe', userId: USER_ID }),
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Jane Doe')
  })
})

describe('DELETE /api/v1/safety/toolbox-talks/:id/attendees/:attendeeId', () => {
  it('removes an attendee and returns 204', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.toolboxTalkAttendee.findFirst.mockResolvedValue(mockAttendee)
    prisma.toolboxTalkAttendee.delete.mockResolvedValue(mockAttendee)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/toolbox-talks/talk-1/attendees/attendee-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })
})

// ─── Safety Form Routes ───────────────────────────────────────────────────────

describe('GET /api/v1/safety/forms', () => {
  it('returns 200 for authenticated users', async () => {
    const prisma = createMockPrisma()
    prisma.safetyForm.findMany.mockResolvedValue([mockForm])
    prisma.safetyForm.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/forms',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].title).toBe('Daily Inspection')
  })
})

describe('POST /api/v1/safety/forms', () => {
  it('creates a form and returns 201', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyForm.create.mockResolvedValue(mockForm)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/forms',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Daily Inspection' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/forms',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Daily Inspection' }),
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('PATCH /api/v1/safety/forms/:id', () => {
  it('can deactivate a form', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyForm.findFirst.mockResolvedValue(mockForm)
    prisma.safetyForm.update.mockResolvedValue({ ...mockForm, isActive: false })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/forms/form-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('DELETE /api/v1/safety/forms/:id', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.safetyForm.findFirst.mockResolvedValue(mockForm)
    prisma.safetyForm.delete.mockResolvedValue(mockForm)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/forms/form-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/forms/form-1',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

// ─── Incident Report Routes ───────────────────────────────────────────────────

describe('GET /api/v1/safety/incidents', () => {
  it('returns 200 for Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.incidentReport.findMany.mockResolvedValue([mockIncident])
    prisma.incidentReport.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/incidents',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].incidentType).toBe('NEAR_MISS')
  })

  it('returns 403 for FieldUser (read incidents restricted)', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/safety/incidents',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('POST /api/v1/safety/incidents', () => {
  it('allows FieldUser to create an incident report', async () => {
    const prisma = createMockPrisma()
    prisma.incidentReport.create.mockResolvedValue(mockIncident)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/incidents',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Near-Miss: Tool Drop',
        incidentType: 'NEAR_MISS',
        incidentDate: new Date().toISOString(),
        description: 'A hammer fell from scaffolding.',
      }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 400 for invalid incidentType', async () => {
    const { app } = await buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/safety/incidents',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        incidentType: 'INVALID_TYPE',
        incidentDate: new Date().toISOString(),
        description: 'Description.',
      }),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/safety/incidents/:id', () => {
  it('returns 200 after update by Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.incidentReport.findFirst.mockResolvedValue(mockIncident)
    prisma.incidentReport.update.mockResolvedValue({ ...mockIncident, status: 'CLOSED' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/incidents/incident-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED', correctiveAction: 'Tether kits distributed.' }),
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('CLOSED')
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/safety/incidents/incident-1',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('DELETE /api/v1/safety/incidents/:id', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.incidentReport.findFirst.mockResolvedValue(mockIncident)
    prisma.incidentReport.delete.mockResolvedValue(mockIncident)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/incidents/incident-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/safety/incidents/incident-1',
      headers: { authorization: fieldToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})
