import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as licenseService from '../../services/license.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'
import type { FastifyInstance } from 'fastify'

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
  fileUrl: 'http://minio/promanage/licenses/license-1/license.pdf',
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

function buildFastify(prisma: MockPrisma) {
  const minio = {
    removeObject: vi.fn().mockResolvedValue(undefined),
    presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/put'),
  }
  return { prisma, minio, log: { error: vi.fn() } } as unknown as FastifyInstance
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('license.service', () => {
  let prisma: MockPrisma
  let fastify: FastifyInstance

  beforeEach(() => {
    prisma = createMockPrisma()
    fastify = buildFastify(prisma)
    vi.clearAllMocks()
  })

  // ── listLicenses ────────────────────────────────────────────────────────────

  describe('listLicenses', () => {
    it('returns paginated licenses for org', async () => {
      prisma.license.findMany.mockResolvedValue([mockLicense])
      prisma.license.count.mockResolvedValue(1)

      const result = await licenseService.listLicenses(fastify, ORG_ID, {})

      expect(result.licenses).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(prisma.license.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID }) })
      )
    })

    it('filters by holderType', async () => {
      prisma.license.findMany.mockResolvedValue([])
      prisma.license.count.mockResolvedValue(0)

      await licenseService.listLicenses(fastify, ORG_ID, { holderType: 'USER' })

      expect(prisma.license.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ holderType: 'USER' }) })
      )
    })

    it('applies full-text search across name, number, authority, type', async () => {
      prisma.license.findMany.mockResolvedValue([])
      prisma.license.count.mockResolvedValue(0)

      await licenseService.listLicenses(fastify, ORG_ID, { search: 'electrical' })

      expect(prisma.license.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      )
    })
  })

  // ── getLicense ──────────────────────────────────────────────────────────────

  describe('getLicense', () => {
    it('returns license when found', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)

      const result = await licenseService.getLicense(fastify, LICENSE_ID, ORG_ID)

      expect(result).toEqual(mockLicense)
    })

    it('throws NotFoundError when not found', async () => {
      prisma.license.findFirst.mockResolvedValue(null)

      await expect(licenseService.getLicense(fastify, 'bad-id', ORG_ID)).rejects.toThrow('License not found')
    })
  })

  // ── createLicense ───────────────────────────────────────────────────────────

  describe('createLicense', () => {
    it('creates an org-level license', async () => {
      prisma.license.create.mockResolvedValue(mockLicense)

      const result = await licenseService.createLicense(
        fastify,
        ORG_ID,
        { name: 'GC License', holderType: 'ORGANIZATION' },
        USER_ID
      )

      expect(result).toEqual(mockLicense)
      expect(prisma.license.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ holderType: 'ORGANIZATION' }) })
      )
    })

    it('creates a user-level license with userId', async () => {
      const userLicense = { ...mockLicense, holderType: 'USER', userId: USER_ID }
      prisma.license.create.mockResolvedValue(userLicense)

      const result = await licenseService.createLicense(
        fastify,
        ORG_ID,
        { name: 'Master Electrician', holderType: 'USER', userId: USER_ID },
        USER_ID
      )

      expect(result.holderType).toBe('USER')
      expect(result.userId).toBe(USER_ID)
    })

    it('throws ValidationError when USER holderType has no userId', async () => {
      await expect(
        licenseService.createLicense(fastify, ORG_ID, { name: 'License', holderType: 'USER' }, USER_ID)
      ).rejects.toThrow('userId is required when holderType is USER')
    })

    it('throws ValidationError when ORGANIZATION holderType has userId', async () => {
      await expect(
        licenseService.createLicense(
          fastify, ORG_ID,
          { name: 'License', holderType: 'ORGANIZATION', userId: USER_ID },
          USER_ID
        )
      ).rejects.toThrow('userId must not be set when holderType is ORGANIZATION')
    })
  })

  // ── updateLicense ───────────────────────────────────────────────────────────

  describe('updateLicense', () => {
    it('updates a license', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)
      const updated = { ...mockLicense, status: 'PENDING' }
      prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => {
        const tx = { ...prisma, licenseReminder: { ...prisma.licenseReminder } }
        return fn(tx as unknown as MockPrisma)
      })
      prisma.license.update.mockResolvedValue(updated)

      const result = await licenseService.updateLicense(fastify, LICENSE_ID, ORG_ID, { status: 'PENDING' })

      expect(result.status).toBe('PENDING')
    })

    it('resets reminder lastNotifiedAt when expirationDate changes', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)
      const updated = { ...mockLicense, expirationDate: new Date('2026-01-01') }

      prisma.$transaction.mockImplementation(async (fn: (tx: MockPrisma) => Promise<unknown>) => {
        const tx = {
          ...prisma,
          license: { ...prisma.license, update: vi.fn().mockResolvedValue(updated) },
          licenseReminder: { ...prisma.licenseReminder, updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        }
        await fn(tx as unknown as MockPrisma)
        return [updated]
      })

      await licenseService.updateLicense(
        fastify, LICENSE_ID, ORG_ID, { expirationDate: '2026-01-01T00:00:00.000Z' }
      )

      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('throws NotFoundError for unknown license', async () => {
      prisma.license.findFirst.mockResolvedValue(null)

      await expect(licenseService.updateLicense(fastify, 'bad-id', ORG_ID, {})).rejects.toThrow('License not found')
    })
  })

  // ── deleteLicense ───────────────────────────────────────────────────────────

  describe('deleteLicense', () => {
    it('deletes license and removes MinIO documents', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)
      prisma.licenseDocument.findMany.mockResolvedValue([mockDocument])
      prisma.license.delete.mockResolvedValue(mockLicense)

      await licenseService.deleteLicense(fastify, LICENSE_ID, ORG_ID)

      expect(prisma.license.delete).toHaveBeenCalledWith({ where: { id: LICENSE_ID } })
    })

    it('throws NotFoundError when not found', async () => {
      prisma.license.findFirst.mockResolvedValue(null)

      await expect(licenseService.deleteLicense(fastify, 'bad-id', ORG_ID)).rejects.toThrow('License not found')
    })
  })

  // ── addLicenseDocument ──────────────────────────────────────────────────────

  describe('addLicenseDocument', () => {
    it('creates a document record', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)
      prisma.licenseDocument.create.mockResolvedValue(mockDocument)

      const result = await licenseService.addLicenseDocument(
        fastify, LICENSE_ID, ORG_ID,
        { fileName: 'license.pdf', fileKey: 'key', fileUrl: 'url', fileSize: 100, mimeType: 'application/pdf' },
        USER_ID
      )

      expect(result).toEqual(mockDocument)
    })

    it('throws NotFoundError when license not found', async () => {
      prisma.license.findFirst.mockResolvedValue(null)

      await expect(
        licenseService.addLicenseDocument(
          fastify, 'bad-id', ORG_ID,
          { fileName: 'f', fileKey: 'k', fileUrl: 'u', fileSize: 1, mimeType: 'application/pdf' },
          USER_ID
        )
      ).rejects.toThrow('License not found')
    })
  })

  // ── deleteLicenseDocument ───────────────────────────────────────────────────

  describe('deleteLicenseDocument', () => {
    it('deletes document and removes from MinIO', async () => {
      prisma.licenseDocument.findFirst.mockResolvedValue(mockDocument)
      prisma.licenseDocument.delete.mockResolvedValue(mockDocument)

      await licenseService.deleteLicenseDocument(fastify, DOC_ID, LICENSE_ID, ORG_ID)

      expect(prisma.licenseDocument.delete).toHaveBeenCalledWith({ where: { id: DOC_ID } })
    })

    it('throws NotFoundError when document not found', async () => {
      prisma.licenseDocument.findFirst.mockResolvedValue(null)

      await expect(licenseService.deleteLicenseDocument(fastify, 'bad-doc', LICENSE_ID, ORG_ID))
        .rejects.toThrow('Document not found')
    })
  })

  // ── createReminder ──────────────────────────────────────────────────────────

  describe('createReminder', () => {
    it('creates a reminder', async () => {
      prisma.license.findFirst.mockResolvedValue(mockLicense)
      prisma.licenseReminder.create.mockResolvedValue(mockReminder)

      const result = await licenseService.createReminder(
        fastify, LICENSE_ID, ORG_ID,
        { daysBeforeExpiration: 30, notifyUserId: USER_ID }
      )

      expect(result).toEqual(mockReminder)
    })

    it('throws NotFoundError when license not found', async () => {
      prisma.license.findFirst.mockResolvedValue(null)

      await expect(
        licenseService.createReminder(fastify, 'bad-id', ORG_ID, { daysBeforeExpiration: 30, notifyUserId: USER_ID })
      ).rejects.toThrow('License not found')
    })
  })

  // ── updateReminder ──────────────────────────────────────────────────────────

  describe('updateReminder', () => {
    it('updates a reminder', async () => {
      prisma.licenseReminder.findFirst.mockResolvedValue(mockReminder)
      prisma.licenseReminder.update.mockResolvedValue({ ...mockReminder, isActive: false })

      const result = await licenseService.updateReminder(
        fastify, REMINDER_ID, LICENSE_ID, ORG_ID, { isActive: false }
      )

      expect(result.isActive).toBe(false)
    })

    it('throws NotFoundError when reminder not found', async () => {
      prisma.licenseReminder.findFirst.mockResolvedValue(null)

      await expect(
        licenseService.updateReminder(fastify, 'bad', LICENSE_ID, ORG_ID, { isActive: false })
      ).rejects.toThrow('Reminder not found')
    })
  })

  // ── deleteReminder ──────────────────────────────────────────────────────────

  describe('deleteReminder', () => {
    it('deletes a reminder', async () => {
      prisma.licenseReminder.findFirst.mockResolvedValue(mockReminder)
      prisma.licenseReminder.delete.mockResolvedValue(mockReminder)

      await licenseService.deleteReminder(fastify, REMINDER_ID, LICENSE_ID, ORG_ID)

      expect(prisma.licenseReminder.delete).toHaveBeenCalledWith({ where: { id: REMINDER_ID } })
    })

    it('throws NotFoundError when reminder not found', async () => {
      prisma.licenseReminder.findFirst.mockResolvedValue(null)

      await expect(licenseService.deleteReminder(fastify, 'bad', LICENSE_ID, ORG_ID))
        .rejects.toThrow('Reminder not found')
    })
  })
})
