import { Prisma } from '@prisma/client'
import { describe, it, expect, beforeEach } from 'vitest'

import { buildSubmittalTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const PROJECT_ID = 'proj-1'
const SUBMITTAL_ID = 'submittal-1'
const DOC_ID = 'doc-1'

function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as never)
}

const mockSubmittal = {
  id: SUBMITTAL_ID,
  submittalNumber: 'S-001',
  specSection: '03-300',
  title: 'Concrete Mix Design',
  description: null,
  type: 'PRODUCT_DATA',
  status: 'DRAFT',
  revision: 1,
  submittedDate: null,
  requiredByDate: null,
  returnedDate: null,
  ballInCourt: 'GC',
  approver: null,
  notes: null,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  createdById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  project: { id: PROJECT_ID, name: 'Test Project', number: 'P-001' },
  createdBy: { id: USER_ID, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
  documents: [],
}

const mockDoc = {
  id: DOC_ID,
  name: 'Mix Design Report.pdf',
  fileKey: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  notes: null,
  submittalId: SUBMITTAL_ID,
  uploadedById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  uploadedBy: { id: USER_ID, firstName: 'Test', lastName: 'User' },
}

describe('Submittal Routes', () => {
  let prisma: MockPrisma
  let app: Awaited<ReturnType<typeof buildSubmittalTestApp>>['app']
  let token: string

  beforeEach(async () => {
    prisma = createMockPrisma()
    const built = await buildSubmittalTestApp(prisma)
    app = built.app
    token = signTestToken(app, { sub: USER_ID, email: 'test@example.com', organizationId: ORG_ID })
  })

  // ─── GET /submittals ─────────────────────────────────────────────────────────

  describe('GET /api/v1/submittals', () => {
    it('returns 400 when projectId is missing', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns submittals for a project', async () => {
      prisma.submittal.findMany.mockResolvedValue([mockSubmittal] as never)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals?projectId=${PROJECT_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].submittalNumber).toBe('S-001')
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/submittals?projectId=${PROJECT_ID}` })
      expect(res.statusCode).toBe(401)
    })
  })

  // ─── GET /submittals/:id ─────────────────────────────────────────────────────

  describe('GET /api/v1/submittals/:id', () => {
    it('returns a submittal by id', async () => {
      prisma.submittal.findFirst.mockResolvedValue(mockSubmittal as never)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals/${SUBMITTAL_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(SUBMITTAL_ID)
    })

    it('returns 404 when submittal not found', async () => {
      prisma.submittal.findFirst.mockResolvedValue(null)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals/nonexistent`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  // ─── POST /submittals ─────────────────────────────────────────────────────────

  describe('POST /api/v1/submittals', () => {
    const validBody = {
      projectId: PROJECT_ID,
      submittalNumber: 'S-001',
      title: 'Concrete Mix Design',
      type: 'PRODUCT_DATA',
    }

    it('creates a submittal as Admin', async () => {
      mockRole(prisma, 'Admin')
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID } as never)
      prisma.submittal.create.mockResolvedValue(mockSubmittal as never)

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data.submittalNumber).toBe('S-001')
    })

    it('creates a submittal as ProjectManager', async () => {
      mockRole(prisma, 'ProjectManager')
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID } as never)
      prisma.submittal.create.mockResolvedValue(mockSubmittal as never)

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(201)
    })

    it('returns 403 for FieldUser', async () => {
      mockRole(prisma, 'FieldUser')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(403)
    })

    it('returns 404 when project not found', async () => {
      mockRole(prisma, 'Admin')
      prisma.project.findFirst.mockResolvedValue(null)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 409 on duplicate submittal number', async () => {
      mockRole(prisma, 'Admin')
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID } as never)
      const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      })
      prisma.submittal.create.mockRejectedValue(prismaErr)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(409)
    })

    it('returns 400 on schema validation failure', async () => {
      mockRole(prisma, 'Admin')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ submittalNumber: 'S-001' }), // missing required fields
      })
      expect(res.statusCode).toBe(400)
    })

    it('returns 400 for invalid type', async () => {
      mockRole(prisma, 'Admin')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/submittals',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, type: 'INVALID_TYPE' }),
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ─── PATCH /submittals/:id ────────────────────────────────────────────────────

  describe('PATCH /api/v1/submittals/:id', () => {
    it('updates a submittal status', async () => {
      mockRole(prisma, 'ProjectManager')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittal.update.mockResolvedValue({ ...mockSubmittal, status: 'SUBMITTED' } as never)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/submittals/${SUBMITTAL_ID}`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.status).toBe('SUBMITTED')
    })

    it('returns 404 when submittal not found', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue(null)
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/submittals/nonexistent`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      })
      expect(res.statusCode).toBe(404)
    })
  })

  // ─── DELETE /submittals/:id ───────────────────────────────────────────────────

  describe('DELETE /api/v1/submittals/:id', () => {
    it('deletes a submittal as Admin', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittal.delete.mockResolvedValue({} as never)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/submittals/${SUBMITTAL_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(204)
    })

    it('returns 403 for Superintendent', async () => {
      mockRole(prisma, 'Superintendent')
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/submittals/${SUBMITTAL_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  // ─── Documents ───────────────────────────────────────────────────────────────

  describe('GET /api/v1/submittals/:id/documents', () => {
    it('returns documents for a submittal', async () => {
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findMany.mockResolvedValue([mockDoc] as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].name).toBe('Mix Design Report.pdf')
    })
  })

  describe('POST /api/v1/submittals/:id/documents', () => {
    it('creates a document record', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.create.mockResolvedValue(mockDoc as never)

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Mix Design Report.pdf' }),
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data.name).toBe('Mix Design Report.pdf')
    })

    it('returns 400 when name is missing', async () => {
      mockRole(prisma, 'Admin')
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /api/v1/submittals/:id/documents/:docId', () => {
    it('updates document name', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findFirst.mockResolvedValue({ id: DOC_ID } as never)
      prisma.submittalDocument.update.mockResolvedValue({
        ...mockDoc,
        name: 'Updated Report.pdf',
      } as never)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents/${DOC_ID}`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Report.pdf' }),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Updated Report.pdf')
    })
  })

  describe('DELETE /api/v1/submittals/:id/documents/:docId', () => {
    it('deletes a document', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findFirst.mockResolvedValue({ id: DOC_ID, fileKey: null } as never)
      prisma.submittalDocument.delete.mockResolvedValue({} as never)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents/${DOC_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(204)
    })
  })

  describe('POST /api/v1/submittals/:id/documents/:docId/upload-url', () => {
    it('returns a presigned upload URL', async () => {
      mockRole(prisma, 'Admin')
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findFirst.mockResolvedValue({ id: DOC_ID } as never)
      prisma.submittalDocument.update.mockResolvedValue({
        ...mockDoc,
        fileKey: `submittals/${SUBMITTAL_ID}/documents/${DOC_ID}`,
      } as never)

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents/${DOC_ID}/upload-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.url).toContain('presigned-put')
    })
  })

  describe('GET /api/v1/submittals/:id/documents/:docId/download-url', () => {
    it('returns a presigned download URL', async () => {
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findFirst.mockResolvedValue({
        id: DOC_ID,
        fileKey: `submittals/${SUBMITTAL_ID}/documents/${DOC_ID}`,
        fileName: 'report.pdf',
      } as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents/${DOC_ID}/download-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.url).toContain('presigned-get')
    })

    it('returns 404 when no file uploaded', async () => {
      prisma.submittal.findFirst.mockResolvedValue({ id: SUBMITTAL_ID } as never)
      prisma.submittalDocument.findFirst.mockResolvedValue({
        id: DOC_ID,
        fileKey: null,
        fileName: null,
      } as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/submittals/${SUBMITTAL_ID}/documents/${DOC_ID}/download-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })
})
