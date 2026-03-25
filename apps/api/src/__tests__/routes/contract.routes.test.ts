import { Prisma } from '@prisma/client'
import { describe, it, expect, beforeEach } from 'vitest'

import { buildContractTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const PROJECT_ID = 'proj-1'
const CONTRACT_ID = 'contract-1'
const DOC_ID = 'doc-1'

function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as never)
}

const mockContract = {
  id: CONTRACT_ID,
  contractNumber: 'C-001',
  type: 'LUMP_SUM',
  status: 'DRAFT',
  amount: '150000.00',
  customerProjectNumber: null,
  retentionRate: '10.00',
  wageRequirements: null,
  taxStatus: null,
  liquidatedDamages: false,
  liquidatedDamagesRate: null,
  bonded: false,
  billingDate: null,
  startDate: null,
  executedDate: null,
  description: null,
  notes: null,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  proposalId: null,
  createdById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  project: { id: PROJECT_ID, name: 'Test Project', number: 'P-001' },
  proposal: null,
  createdBy: { id: USER_ID, firstName: 'Test', lastName: 'User', email: 'test@example.com' },
  documents: [],
}

const mockDoc = {
  id: DOC_ID,
  type: 'INSURANCE',
  name: 'COI 2026',
  status: 'REQUESTED',
  fileKey: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  notes: null,
  expiresAt: null,
  receivedAt: null,
  contractId: CONTRACT_ID,
  uploadedById: USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  uploadedBy: { id: USER_ID, firstName: 'Test', lastName: 'User' },
}

describe('Contract Routes', () => {
  let prisma: MockPrisma
  let app: Awaited<ReturnType<typeof buildContractTestApp>>['app']
  let token: string

  beforeEach(async () => {
    prisma = createMockPrisma()
    const built = await buildContractTestApp(prisma)
    app = built.app
    token = signTestToken(app, { sub: USER_ID, email: 'test@example.com', organizationId: ORG_ID })
  })

  // ─── GET /contracts ─────────────────────────────────────────────────────────

  describe('GET /api/v1/contracts', () => {
    it('returns 400 when projectId is missing', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/contracts', headers: { authorization: `Bearer ${token}` } })
      expect(res.statusCode).toBe(400)
    })

    it('returns contracts for a project', async () => {
      prisma.contract.findMany.mockResolvedValue([mockContract] as never)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts?projectId=${PROJECT_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].contractNumber).toBe('C-001')
    })

    it('returns 401 when unauthenticated', async () => {
      const res = await app.inject({ method: 'GET', url: `/api/v1/contracts?projectId=${PROJECT_ID}` })
      expect(res.statusCode).toBe(401)
    })
  })

  // ─── GET /contracts/:id ─────────────────────────────────────────────────────

  describe('GET /api/v1/contracts/:id', () => {
    it('returns a contract by id', async () => {
      prisma.contract.findFirst.mockResolvedValue(mockContract as never)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts/${CONTRACT_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe(CONTRACT_ID)
    })

    it('returns 404 when contract not found', async () => {
      prisma.contract.findFirst.mockResolvedValue(null)
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts/nonexistent`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })

  // ─── POST /contracts ─────────────────────────────────────────────────────────

  describe('POST /api/v1/contracts', () => {
    const validBody = {
      projectId: PROJECT_ID,
      contractNumber: 'C-001',
      type: 'LUMP_SUM',
      amount: 150000,
      retentionRate: 10,
    }

    it('creates a contract as Admin', async () => {
      mockRole(prisma, 'Admin')
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID } as never)
      prisma.contract.create.mockResolvedValue(mockContract as never)

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contracts',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data.contractNumber).toBe('C-001')
    })

    it('returns 403 for FieldUser', async () => {
      mockRole(prisma, 'FieldUser')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contracts',
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
        url: '/api/v1/contracts',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(404)
    })

    it('returns 409 on duplicate contract number', async () => {
      mockRole(prisma, 'Admin')
      prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID } as never)
      const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '5.0.0' })
      prisma.contract.create.mockRejectedValue(prismaErr)
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contracts',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      })
      expect(res.statusCode).toBe(409)
    })

    it('returns 400 on schema validation failure', async () => {
      mockRole(prisma, 'Admin')
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/contracts',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ contractNumber: 'C-001' }), // missing required fields
      })
      expect(res.statusCode).toBe(400)
    })
  })

  // ─── PATCH /contracts/:id ────────────────────────────────────────────────────

  describe('PATCH /api/v1/contracts/:id', () => {
    it('updates a contract', async () => {
      mockRole(prisma, 'ProjectManager')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contract.update.mockResolvedValue({ ...mockContract, status: 'ACTIVE' } as never)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/contracts/${CONTRACT_ID}`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.status).toBe('ACTIVE')
    })

    it('returns 404 when contract not found', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue(null)
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/contracts/nonexistent`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })
      expect(res.statusCode).toBe(404)
    })
  })

  // ─── DELETE /contracts/:id ───────────────────────────────────────────────────

  describe('DELETE /api/v1/contracts/:id', () => {
    it('deletes a contract as Admin', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contract.delete.mockResolvedValue({} as never)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/contracts/${CONTRACT_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(204)
    })

    it('returns 403 for Superintendent', async () => {
      mockRole(prisma, 'Superintendent')
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/contracts/${CONTRACT_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(403)
    })
  })

  // ─── Documents ───────────────────────────────────────────────────────────────

  describe('GET /api/v1/contracts/:id/documents', () => {
    it('returns documents for a contract', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findMany.mockResolvedValue([mockDoc] as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().data[0].type).toBe('INSURANCE')
    })
  })

  describe('POST /api/v1/contracts/:id/documents', () => {
    it('creates a document record', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.create.mockResolvedValue(mockDoc as never)

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'INSURANCE', name: 'COI 2026' }),
      })
      expect(res.statusCode).toBe(201)
      expect(res.json().data.type).toBe('INSURANCE')
    })

    it('returns 400 on invalid document type', async () => {
      mockRole(prisma, 'Admin')
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'INVALID_TYPE', name: 'COI' }),
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /api/v1/contracts/:id/documents/:docId', () => {
    it('updates document status', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findFirst.mockResolvedValue({ id: DOC_ID } as never)
      prisma.contractDocument.update.mockResolvedValue({ ...mockDoc, status: 'RECEIVED' } as never)

      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents/${DOC_ID}`,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED' }),
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.status).toBe('RECEIVED')
    })
  })

  describe('DELETE /api/v1/contracts/:id/documents/:docId', () => {
    it('deletes a document', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findFirst.mockResolvedValue({ id: DOC_ID, fileKey: null } as never)
      prisma.contractDocument.delete.mockResolvedValue({} as never)

      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents/${DOC_ID}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(204)
    })
  })

  describe('POST /api/v1/contracts/:id/documents/:docId/upload-url', () => {
    it('returns a presigned upload URL', async () => {
      mockRole(prisma, 'Admin')
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findFirst.mockResolvedValue({ id: DOC_ID } as never)
      prisma.contractDocument.update.mockResolvedValue({ ...mockDoc, fileKey: `contracts/${CONTRACT_ID}/documents/${DOC_ID}` } as never)

      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents/${DOC_ID}/upload-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.url).toContain('presigned-put')
    })
  })

  describe('GET /api/v1/contracts/:id/documents/:docId/download-url', () => {
    it('returns a presigned download URL', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findFirst.mockResolvedValue({ id: DOC_ID, fileKey: 'contracts/c1/documents/d1', fileName: 'coi.pdf' } as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents/${DOC_ID}/download-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json().data.url).toContain('presigned-get')
    })

    it('returns 404 when no file uploaded', async () => {
      prisma.contract.findFirst.mockResolvedValue({ id: CONTRACT_ID } as never)
      prisma.contractDocument.findFirst.mockResolvedValue({ id: DOC_ID, fileKey: null, fileName: null } as never)

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/contracts/${CONTRACT_ID}/documents/${DOC_ID}/download-url`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(res.statusCode).toBe(404)
    })
  })
})
