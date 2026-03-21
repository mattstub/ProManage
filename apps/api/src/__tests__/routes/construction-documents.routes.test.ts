import { describe, expect, it } from 'vitest'

import { buildConstructionDocumentTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const PROJECT_ID = 'project-1'

const mockProject = { id: PROJECT_ID, organizationId: ORG_ID, name: 'Test Project' }

const mockDiscipline = {
  id: 'disc-1',
  name: 'Architectural',
  abbreviation: 'A',
  sortOrder: 0,
  organizationId: ORG_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockSet = {
  id: 'set-1',
  name: 'Issued for Construction',
  phase: 'CONSTRUCTION_DOCUMENTS',
  issueDate: null,
  issuedBy: null,
  description: null,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  createdById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockSheet = {
  id: 'sheet-1',
  sheetNumber: 'A-101',
  title: 'Floor Plan',
  sortOrder: 0,
  discipline: null,
  currentRevision: null,
  revisionCount: 0,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  disciplineId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockSection = {
  id: 'section-1',
  sectionNumber: '03 00 00',
  title: 'Concrete',
  description: null,
  sortOrder: 0,
  currentRevision: null,
  revisionCount: 0,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  createdById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }])
}

// ─── Disciplines ─────────────────────────────────────────────────────────────

describe('GET /api/v1/construction-documents/disciplines', () => {
  it('returns 200 with disciplines list', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })

    prisma.drawingDiscipline.findMany.mockResolvedValue([mockDiscipline])

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/construction-documents/disciplines',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Architectural')
  })

  it('returns 401 when unauthenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/construction-documents/disciplines',
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/construction-documents/disciplines', () => {
  it('returns 201 when Admin creates a discipline', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    prisma.drawingDiscipline.findFirst.mockResolvedValue(null)
    prisma.drawingDiscipline.create.mockResolvedValue(mockDiscipline)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/construction-documents/disciplines',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Architectural', abbreviation: 'A' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Architectural')
  })

  it('returns 403 when FieldUser tries to create discipline', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'FieldUser')

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/construction-documents/disciplines',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Mechanical' },
    })

    expect(res.statusCode).toBe(403)
  })
})

// ─── Drawing Sets ─────────────────────────────────────────────────────────────

describe('GET /api/v1/construction-documents/:projectId/drawing-sets', () => {
  it('returns 200 with drawing sets list', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingSet.findMany.mockResolvedValue([mockSet])

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sets`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(res.json().data[0].name).toBe('Issued for Construction')
  })
})

describe('POST /api/v1/construction-documents/:projectId/drawing-sets', () => {
  it('returns 201 when Admin creates a drawing set', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingSet.create.mockResolvedValue(mockSet)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sets`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Issued for Construction' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.phase).toBe('CONSTRUCTION_DOCUMENTS')
  })
})

// ─── Drawing Sheets ───────────────────────────────────────────────────────────

describe('GET /api/v1/construction-documents/:projectId/drawing-sheets', () => {
  it('returns 200 with sheets including discipline and current revision', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingSheet.findMany.mockResolvedValue([
      {
        ...mockSheet,
        discipline: null,
        revisions: [],
        _count: { revisions: 0 },
      },
    ])

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sheets`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].sheetNumber).toBe('A-101')
  })
})

describe('POST /api/v1/construction-documents/:projectId/drawing-sheets', () => {
  it('returns 201 when PM creates a sheet', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'ProjectManager')

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingSheet.findFirst.mockResolvedValue(null)
    prisma.drawingSheet.create.mockResolvedValue(mockSheet)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sheets`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sheetNumber: 'A-101', title: 'Floor Plan' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.sheetNumber).toBe('A-101')
  })

  it('returns 422 when required fields missing', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sheets`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sheetNumber: 'A-101' }, // missing title
    })

    expect(res.statusCode).toBe(400)
  })
})

// ─── Drawing Revisions ────────────────────────────────────────────────────────

describe('POST /api/v1/construction-documents/:projectId/drawing-sheets/:sheetId/revisions/upload-url', () => {
  it('returns 200 with presigned URL for valid PDF', async () => {
    const prisma = createMockPrisma()
    const { app, minio } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)
    ;(minio.presignedPutObject as any).mockResolvedValue('https://minio.local/presigned-put')

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/drawing-sheets/sheet-1/revisions/upload-url`,
      headers: { authorization: `Bearer ${token}` },
      payload: { fileName: 'plan.pdf', mimeType: 'application/pdf', fileSize: 1024 * 100 },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.uploadUrl).toBe('https://minio.local/presigned-put')
    expect(res.json().data.fileKey).toContain('drawings/')
  })
})

// ─── Specification Sections ───────────────────────────────────────────────────

describe('GET /api/v1/construction-documents/:projectId/spec-sections', () => {
  it('returns 200 with sections list', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.specificationSection.findMany.mockResolvedValue([
      {
        ...mockSection,
        revisions: [],
        _count: { revisions: 0 },
      },
    ])

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/construction-documents/${PROJECT_ID}/spec-sections`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data[0].sectionNumber).toBe('03 00 00')
  })
})

describe('POST /api/v1/construction-documents/:projectId/spec-sections', () => {
  it('returns 201 when Admin creates a spec section', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.specificationSection.findFirst.mockResolvedValue(null)
    prisma.specificationSection.create.mockResolvedValue(mockSection)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/spec-sections`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sectionNumber: '03 00 00', title: 'Concrete' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.sectionNumber).toBe('03 00 00')
  })

  it('returns 403 when FieldUser tries to create spec section', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'FieldUser')

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/construction-documents/${PROJECT_ID}/spec-sections`,
      headers: { authorization: `Bearer ${token}` },
      payload: { sectionNumber: '03 00 00', title: 'Concrete' },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('DELETE /api/v1/construction-documents/:projectId/spec-sections/:sectionId', () => {
  it('returns 204 when Admin deletes a section', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildConstructionDocumentTestApp(prisma)
    const token = signTestToken(app, { sub: USER_ID, email: 'a@b.com', organizationId: ORG_ID })
    mockRole(prisma, 'Admin')

    prisma.specificationSection.findFirst.mockResolvedValue(mockSection)
    prisma.specificationRevision.findMany.mockResolvedValue([])
    prisma.specificationSection.delete.mockResolvedValue(mockSection)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/construction-documents/${PROJECT_ID}/spec-sections/section-1`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
  })
})
