import { describe, it, expect, vi } from 'vitest'

import { buildLicenseTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const LICENSE_ID = 'license-1'
const DOC_ID = 'doc-1'
const REMINDER_ID = 'reminder-1'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }

const mockLicense = {
  id: LICENSE_ID,
  organizationId: ORG_ID,
  name: 'GC License',
  licenseNumber: 'GC-001',
  authority: 'State Board',
  licenseType: 'General Contractor',
  holderType: 'ORGANIZATION',
  userId: null,
  startDate: new Date('2024-01-01'),
  expirationDate: new Date('2025-01-01'),
  renewalDate: new Date('2024-12-01'),
  status: 'ACTIVE',
  notes: null,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: null,
  createdBy: mockUser,
  documents: [],
  reminders: [],
}

const mockDocument = {
  id: DOC_ID,
  licenseId: LICENSE_ID,
  fileName: 'license.pdf',
  fileKey: 'licenses/license-1/license.pdf',
  fileUrl: 'http://minio/license.pdf',
  fileSize: 12345,
  mimeType: 'application/pdf',
  documentTag: 'Current License',
  uploadedById: USER_ID,
  createdAt: new Date(),
}

const mockReminder = {
  id: REMINDER_ID,
  licenseId: LICENSE_ID,
  daysBeforeExpiration: 30,
  notifyUserId: USER_ID,
  notifySupervisorId: null,
  isActive: true,
  lastNotifiedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  notifyUser: mockUser,
  notifySupervisor: null,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildApp(prisma?: MockPrisma) {
  return buildLicenseTestApp(prisma)
}

function adminToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'jane@example.com', organizationId: ORG_ID })
}

function fieldToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'field@example.com', organizationId: ORG_ID })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/licenses', () => {
  it('returns 200 with paginated licenses', async () => {
    const prisma = createMockPrisma()
    prisma.license.findMany.mockResolvedValue([mockLicense])
    prisma.license.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/licenses',
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe(LICENSE_ID)
  })

  it('returns 401 without auth', async () => {
    const { app } = await buildApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/licenses' })

    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/v1/licenses/:id', () => {
  it('returns 200 with license detail', async () => {
    const prisma = createMockPrisma()
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/licenses/${LICENSE_ID}`,
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(LICENSE_ID)
  })

  it('returns 404 for unknown id', async () => {
    const prisma = createMockPrisma()
    prisma.license.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/licenses/nonexistent',
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/v1/licenses', () => {
  it('returns 201 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.create.mockResolvedValue(mockLicense)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/licenses',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { name: 'GC License', holderType: 'ORGANIZATION' },
    })

    expect(res.statusCode).toBe(201)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/licenses',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      payload: { name: 'License', holderType: 'ORGANIZATION' },
    })

    expect(res.statusCode).toBe(403)
  })

  it('returns 400 for invalid body (missing holderType)', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/licenses',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { name: 'License' },
    })

    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/licenses/:id', () => {
  it('returns 200 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    const updated = { ...mockLicense, status: 'PENDING' }
    prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => {
      const tx = { ...prisma, license: { ...prisma.license, update: vi.fn().mockResolvedValue(updated) }, licenseReminder: { ...prisma.licenseReminder } }
      await fn(tx as unknown as MockPrisma)
      return [updated]
    })
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/licenses/${LICENSE_ID}`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { status: 'PENDING' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/licenses/${LICENSE_ID}`,
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      payload: { status: 'PENDING' },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('DELETE /api/v1/licenses/:id', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    prisma.licenseDocument.findMany.mockResolvedValue([])
    prisma.license.delete.mockResolvedValue(mockLicense)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/licenses/${LICENSE_ID}`,
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 403 for OfficeAdmin (not Admin)', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'OfficeAdmin' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/licenses/${LICENSE_ID}`,
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('POST /api/v1/licenses/:id/documents/upload-url', () => {
  it('returns presigned upload URL for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    const { app, minio } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/licenses/${LICENSE_ID}/documents/upload-url`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { fileName: 'license.pdf', mimeType: 'application/pdf', fileSize: 12345 },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.uploadUrl).toBeDefined()
    expect(body.data.fileKey).toContain(LICENSE_ID)
    expect(minio.presignedPutObject).toHaveBeenCalled()
  })
})

describe('POST /api/v1/licenses/:id/documents', () => {
  it('creates document record after upload confirmation', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    prisma.licenseDocument.create.mockResolvedValue(mockDocument)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/licenses/${LICENSE_ID}/documents`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: {
        fileName: 'license.pdf',
        fileKey: 'licenses/license-1/license.pdf',
        fileSize: 12345,
        mimeType: 'application/pdf',
        documentTag: 'Current License',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.id).toBe(DOC_ID)
  })
})

describe('DELETE /api/v1/licenses/:id/documents/:docId', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.licenseDocument.findFirst.mockResolvedValue(mockDocument)
    prisma.licenseDocument.delete.mockResolvedValue(mockDocument)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/licenses/${LICENSE_ID}/documents/${DOC_ID}`,
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(204)
  })
})

describe('POST /api/v1/licenses/:id/reminders', () => {
  it('returns 201 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.license.findFirst.mockResolvedValue(mockLicense)
    prisma.licenseReminder.create.mockResolvedValue(mockReminder)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/licenses/${LICENSE_ID}/reminders`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { daysBeforeExpiration: 30, notifyUserId: USER_ID },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.daysBeforeExpiration).toBe(30)
  })

  it('returns 400 for daysBeforeExpiration = 0', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/licenses/${LICENSE_ID}/reminders`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { daysBeforeExpiration: 0, notifyUserId: USER_ID },
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 403 for FieldUser', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/licenses/${LICENSE_ID}/reminders`,
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      payload: { daysBeforeExpiration: 30, notifyUserId: USER_ID },
    })

    expect(res.statusCode).toBe(403)
  })
})

describe('PATCH /api/v1/licenses/:id/reminders/:reminderId', () => {
  it('returns 200 when updating reminder', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.licenseReminder.findFirst.mockResolvedValue(mockReminder)
    prisma.licenseReminder.update.mockResolvedValue({ ...mockReminder, isActive: false })
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/licenses/${LICENSE_ID}/reminders/${REMINDER_ID}`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      payload: { isActive: false },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.isActive).toBe(false)
  })
})

describe('DELETE /api/v1/licenses/:id/reminders/:reminderId', () => {
  it('returns 204 for Admin', async () => {
    const prisma = createMockPrisma()
    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.licenseReminder.findFirst.mockResolvedValue(mockReminder)
    prisma.licenseReminder.delete.mockResolvedValue(mockReminder)
    const { app } = await buildApp(prisma)

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/licenses/${LICENSE_ID}/reminders/${REMINDER_ID}`,
      headers: { authorization: adminToken(app) },
    })

    expect(res.statusCode).toBe(204)
  })
})
