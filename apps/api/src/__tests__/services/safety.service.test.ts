import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as safetyService from '../../services/safety.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'
import type { FastifyInstance } from 'fastify'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const USER_2_ID = 'user-2'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }

const mockSafetyDoc = {
  id: 'doc-1',
  organizationId: ORG_ID,
  title: 'Fall Protection Policy',
  description: 'Fall protection requirements.',
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
  userId: USER_2_ID,
  name: 'Field User',
  signedAt: null,
  createdAt: new Date(),
  user: { id: USER_2_ID, firstName: 'Field', lastName: 'User', email: 'field@example.com' },
}

const mockForm = {
  id: 'form-1',
  organizationId: ORG_ID,
  title: 'Daily Inspection',
  description: 'Morning inspection checklist.',
  category: 'INSPECTION',
  content: '1. Check site conditions',
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
  description: 'A hammer fell from scaffolding.',
  correctiveAction: null,
  status: 'OPEN',
  projectId: null,
  reportedById: USER_ID,
  project: null,
  reportedBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function buildFastify(prisma: MockPrisma) {
  const minio = {
    removeObject: vi.fn().mockResolvedValue(undefined),
    presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/put'),
  }
  return { prisma, minio, log: { error: vi.fn() } } as unknown as FastifyInstance
}

const mockPaginated = (items: unknown[]) => ({
  data: items,
  total: items.length,
  page: 1,
  perPage: 20,
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('safety.service', () => {
  let prisma: MockPrisma
  let fastify: FastifyInstance

  beforeEach(() => {
    prisma = createMockPrisma()
    fastify = buildFastify(prisma)
    vi.clearAllMocks()
  })

  // ─── Safety Documents ──────────────────────────────────────────────────────

  describe('listSafetyDocuments', () => {
    it('returns paginated documents scoped to org', async () => {
      prisma.safetyDocument.findMany.mockResolvedValue([mockSafetyDoc])
      prisma.safetyDocument.count.mockResolvedValue(1)
      const result = await safetyService.listSafetyDocuments(fastify, ORG_ID, {})
      expect(result.documents).toHaveLength(1)
      expect(prisma.safetyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: ORG_ID }) })
      )
    })

    it('applies category filter', async () => {
      prisma.safetyDocument.findMany.mockResolvedValue([])
      prisma.safetyDocument.count.mockResolvedValue(0)
      await safetyService.listSafetyDocuments(fastify, ORG_ID, { category: 'POLICY' })
      expect(prisma.safetyDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ category: 'POLICY' }) })
      )
    })
  })

  describe('getSafetyDocument', () => {
    it('returns the document when found', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
      const result = await safetyService.getSafetyDocument(fastify, 'doc-1', ORG_ID)
      expect(result.id).toBe('doc-1')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(null)
      await expect(safetyService.getSafetyDocument(fastify, 'missing', ORG_ID)).rejects.toThrow('Safety document not found')
    })
  })

  describe('createSafetyDocument', () => {
    it('creates document with defaults', async () => {
      prisma.safetyDocument.create.mockResolvedValue(mockSafetyDoc)
      const result = await safetyService.createSafetyDocument(fastify, ORG_ID, {
        title: 'Fall Protection Policy',
        fileName: 'fall-protection.pdf',
        fileKey: 'safety/documents/fall-protection.pdf',
        fileSize: 204800,
        mimeType: 'application/pdf',
      }, USER_ID)
      expect(result.title).toBe('Fall Protection Policy')
      expect(prisma.safetyDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ category: 'POLICY' }) })
      )
    })
  })

  describe('updateSafetyDocument', () => {
    it('updates an existing document', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
      prisma.safetyDocument.update.mockResolvedValue({ ...mockSafetyDoc, title: 'Updated' })
      const result = await safetyService.updateSafetyDocument(fastify, 'doc-1', ORG_ID, { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(null)
      await expect(safetyService.updateSafetyDocument(fastify, 'missing', ORG_ID, {})).rejects.toThrow('Safety document not found')
    })
  })

  describe('deleteSafetyDocument', () => {
    it('removes MinIO object and deletes record', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
      prisma.safetyDocument.delete.mockResolvedValue(mockSafetyDoc)
      const minio = (fastify as any).minio
      await safetyService.deleteSafetyDocument(fastify, 'doc-1', ORG_ID)
      expect(minio.removeObject).toHaveBeenCalledWith(expect.any(String), mockSafetyDoc.fileKey)
      expect(prisma.safetyDocument.delete).toHaveBeenCalledWith({ where: { id: 'doc-1' } })
    })

    it('still deletes record if MinIO removal fails', async () => {
      prisma.safetyDocument.findFirst.mockResolvedValue(mockSafetyDoc)
      prisma.safetyDocument.delete.mockResolvedValue(mockSafetyDoc)
      ;(fastify as any).minio.removeObject.mockRejectedValue(new Error('MinIO error'))
      await expect(safetyService.deleteSafetyDocument(fastify, 'doc-1', ORG_ID)).resolves.toBeUndefined()
      expect(prisma.safetyDocument.delete).toHaveBeenCalled()
    })
  })

  // ─── SDS ──────────────────────────────────────────────────────────────────

  describe('listSdsEntries', () => {
    it('returns paginated SDS entries', async () => {
      prisma.sdsEntry.findMany.mockResolvedValue([mockSdsEntry])
      prisma.sdsEntry.count.mockResolvedValue(1)
      const result = await safetyService.listSdsEntries(fastify, ORG_ID, {})
      expect(result.entries).toHaveLength(1)
    })

    it('applies search filter', async () => {
      prisma.sdsEntry.findMany.mockResolvedValue([])
      prisma.sdsEntry.count.mockResolvedValue(0)
      await safetyService.listSdsEntries(fastify, ORG_ID, { search: 'PVC' })
      expect(prisma.sdsEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) })
      )
    })
  })

  describe('getSdsEntry', () => {
    it('returns entry when found', async () => {
      prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
      const result = await safetyService.getSdsEntry(fastify, 'sds-1', ORG_ID)
      expect(result.productName).toBe('PVC Primer')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.sdsEntry.findFirst.mockResolvedValue(null)
      await expect(safetyService.getSdsEntry(fastify, 'missing', ORG_ID)).rejects.toThrow('SDS entry not found')
    })
  })

  describe('createSdsEntry', () => {
    it('creates an SDS entry', async () => {
      prisma.sdsEntry.create.mockResolvedValue(mockSdsEntry)
      const result = await safetyService.createSdsEntry(fastify, ORG_ID, { productName: 'PVC Primer' }, USER_ID)
      expect(result.productName).toBe('PVC Primer')
    })
  })

  describe('updateSdsEntry', () => {
    it('updates an existing SDS entry', async () => {
      prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
      prisma.sdsEntry.update.mockResolvedValue({ ...mockSdsEntry, manufacturer: 'Updated Co' })
      const result = await safetyService.updateSdsEntry(fastify, 'sds-1', ORG_ID, { manufacturer: 'Updated Co' })
      expect(result.manufacturer).toBe('Updated Co')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.sdsEntry.findFirst.mockResolvedValue(null)
      await expect(safetyService.updateSdsEntry(fastify, 'missing', ORG_ID, {})).rejects.toThrow('SDS entry not found')
    })
  })

  describe('deleteSdsEntry', () => {
    it('deletes entry without SDS file', async () => {
      prisma.sdsEntry.findFirst.mockResolvedValue(mockSdsEntry)
      prisma.sdsEntry.delete.mockResolvedValue(mockSdsEntry)
      await safetyService.deleteSdsEntry(fastify, 'sds-1', ORG_ID)
      expect(prisma.sdsEntry.delete).toHaveBeenCalledWith({ where: { id: 'sds-1' } })
    })

    it('removes MinIO object when sdsFileKey exists', async () => {
      const entryWithFile = { ...mockSdsEntry, sdsFileKey: 'safety/sds/pvc-primer.pdf' }
      prisma.sdsEntry.findFirst.mockResolvedValue(entryWithFile)
      prisma.sdsEntry.delete.mockResolvedValue(entryWithFile)
      const minio = (fastify as any).minio
      await safetyService.deleteSdsEntry(fastify, 'sds-1', ORG_ID)
      expect(minio.removeObject).toHaveBeenCalledWith(expect.any(String), 'safety/sds/pvc-primer.pdf')
    })
  })

  // ─── Toolbox Talks ─────────────────────────────────────────────────────────

  describe('listToolboxTalks', () => {
    it('returns paginated talks', async () => {
      prisma.toolboxTalk.findMany.mockResolvedValue([mockTalk])
      prisma.toolboxTalk.count.mockResolvedValue(1)
      const result = await safetyService.listToolboxTalks(fastify, ORG_ID, {})
      expect(result.talks).toHaveLength(1)
    })

    it('applies status and projectId filters', async () => {
      prisma.toolboxTalk.findMany.mockResolvedValue([])
      prisma.toolboxTalk.count.mockResolvedValue(0)
      await safetyService.listToolboxTalks(fastify, ORG_ID, { status: 'COMPLETED', projectId: 'proj-1' })
      expect(prisma.toolboxTalk.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'COMPLETED', projectId: 'proj-1' }),
        })
      )
    })
  })

  describe('getToolboxTalk', () => {
    it('returns talk when found', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
      const result = await safetyService.getToolboxTalk(fastify, 'talk-1', ORG_ID)
      expect(result.title).toBe('Ladder Safety')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(null)
      await expect(safetyService.getToolboxTalk(fastify, 'missing', ORG_ID)).rejects.toThrow('Toolbox talk not found')
    })
  })

  describe('createToolboxTalk', () => {
    it('creates a toolbox talk', async () => {
      prisma.toolboxTalk.create.mockResolvedValue(mockTalk)
      const result = await safetyService.createToolboxTalk(fastify, ORG_ID, { title: 'Ladder Safety' }, USER_ID)
      expect(result.title).toBe('Ladder Safety')
    })
  })

  describe('updateToolboxTalk', () => {
    it('updates status to COMPLETED', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
      prisma.toolboxTalk.update.mockResolvedValue({ ...mockTalk, status: 'COMPLETED' })
      const result = await safetyService.updateToolboxTalk(fastify, 'talk-1', ORG_ID, { status: 'COMPLETED' })
      expect(result.status).toBe('COMPLETED')
    })
  })

  describe('deleteToolboxTalk', () => {
    it('deletes the talk', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
      prisma.toolboxTalk.delete.mockResolvedValue(mockTalk)
      await safetyService.deleteToolboxTalk(fastify, 'talk-1', ORG_ID)
      expect(prisma.toolboxTalk.delete).toHaveBeenCalledWith({ where: { id: 'talk-1' } })
    })
  })

  describe('addAttendee', () => {
    it('adds an attendee to the talk', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(mockTalk)
      prisma.toolboxTalkAttendee.create.mockResolvedValue(mockAttendee)
      const result = await safetyService.addAttendee(fastify, 'talk-1', ORG_ID, { name: 'Field User', userId: USER_2_ID })
      expect(result.name).toBe('Field User')
    })

    it('throws NotFoundError when talk not found', async () => {
      prisma.toolboxTalk.findFirst.mockResolvedValue(null)
      await expect(safetyService.addAttendee(fastify, 'missing', ORG_ID, { name: 'Joe' })).rejects.toThrow('Toolbox talk not found')
    })
  })

  describe('removeAttendee', () => {
    it('removes an attendee', async () => {
      prisma.toolboxTalkAttendee.findFirst.mockResolvedValue(mockAttendee)
      prisma.toolboxTalkAttendee.delete.mockResolvedValue(mockAttendee)
      await safetyService.removeAttendee(fastify, 'attendee-1', 'talk-1', ORG_ID)
      expect(prisma.toolboxTalkAttendee.delete).toHaveBeenCalledWith({ where: { id: 'attendee-1' } })
    })

    it('throws NotFoundError when attendee not found', async () => {
      prisma.toolboxTalkAttendee.findFirst.mockResolvedValue(null)
      await expect(safetyService.removeAttendee(fastify, 'missing', 'talk-1', ORG_ID)).rejects.toThrow('Attendee not found')
    })
  })

  // ─── Safety Forms ──────────────────────────────────────────────────────────

  describe('listSafetyForms', () => {
    it('returns paginated forms', async () => {
      prisma.safetyForm.findMany.mockResolvedValue([mockForm])
      prisma.safetyForm.count.mockResolvedValue(1)
      const result = await safetyService.listSafetyForms(fastify, ORG_ID, {})
      expect(result.forms).toHaveLength(1)
    })

    it('filters by isActive', async () => {
      prisma.safetyForm.findMany.mockResolvedValue([mockForm])
      prisma.safetyForm.count.mockResolvedValue(1)
      await safetyService.listSafetyForms(fastify, ORG_ID, { isActive: true })
      expect(prisma.safetyForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
      )
    })
  })

  describe('getSafetyForm', () => {
    it('returns form when found', async () => {
      prisma.safetyForm.findFirst.mockResolvedValue(mockForm)
      const result = await safetyService.getSafetyForm(fastify, 'form-1', ORG_ID)
      expect(result.title).toBe('Daily Inspection')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.safetyForm.findFirst.mockResolvedValue(null)
      await expect(safetyService.getSafetyForm(fastify, 'missing', ORG_ID)).rejects.toThrow('Safety form not found')
    })
  })

  describe('createSafetyForm', () => {
    it('creates a form with default category', async () => {
      prisma.safetyForm.create.mockResolvedValue(mockForm)
      const result = await safetyService.createSafetyForm(fastify, ORG_ID, { title: 'Daily Inspection' }, USER_ID)
      expect(result.title).toBe('Daily Inspection')
      expect(prisma.safetyForm.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ category: 'INSPECTION' }) })
      )
    })
  })

  describe('updateSafetyForm', () => {
    it('can deactivate a form', async () => {
      prisma.safetyForm.findFirst.mockResolvedValue(mockForm)
      prisma.safetyForm.update.mockResolvedValue({ ...mockForm, isActive: false })
      const result = await safetyService.updateSafetyForm(fastify, 'form-1', ORG_ID, { isActive: false })
      expect(result.isActive).toBe(false)
    })
  })

  describe('deleteSafetyForm', () => {
    it('deletes the form', async () => {
      prisma.safetyForm.findFirst.mockResolvedValue(mockForm)
      prisma.safetyForm.delete.mockResolvedValue(mockForm)
      await safetyService.deleteSafetyForm(fastify, 'form-1', ORG_ID)
      expect(prisma.safetyForm.delete).toHaveBeenCalledWith({ where: { id: 'form-1' } })
    })
  })

  // ─── Incident Reports ──────────────────────────────────────────────────────

  describe('listIncidentReports', () => {
    it('returns paginated reports', async () => {
      prisma.incidentReport.findMany.mockResolvedValue([mockIncident])
      prisma.incidentReport.count.mockResolvedValue(1)
      const result = await safetyService.listIncidentReports(fastify, ORG_ID, {})
      expect(result.reports).toHaveLength(1)
    })

    it('filters by status and incidentType', async () => {
      prisma.incidentReport.findMany.mockResolvedValue([])
      prisma.incidentReport.count.mockResolvedValue(0)
      await safetyService.listIncidentReports(fastify, ORG_ID, { status: 'OPEN', incidentType: 'NEAR_MISS' })
      expect(prisma.incidentReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN', incidentType: 'NEAR_MISS' }),
        })
      )
    })
  })

  describe('getIncidentReport', () => {
    it('returns report when found', async () => {
      prisma.incidentReport.findFirst.mockResolvedValue(mockIncident)
      const result = await safetyService.getIncidentReport(fastify, 'incident-1', ORG_ID)
      expect(result.title).toBe('Near-Miss: Tool Drop')
    })

    it('throws NotFoundError when not found', async () => {
      prisma.incidentReport.findFirst.mockResolvedValue(null)
      await expect(safetyService.getIncidentReport(fastify, 'missing', ORG_ID)).rejects.toThrow('Incident report not found')
    })
  })

  describe('createIncidentReport', () => {
    it('creates a report', async () => {
      prisma.incidentReport.create.mockResolvedValue(mockIncident)
      const result = await safetyService.createIncidentReport(fastify, ORG_ID, {
        title: 'Near-Miss: Tool Drop',
        incidentType: 'NEAR_MISS',
        incidentDate: new Date().toISOString(),
        description: 'A hammer fell.',
      }, USER_ID)
      expect(result.incidentType).toBe('NEAR_MISS')
    })
  })

  describe('updateIncidentReport', () => {
    it('can close a report with corrective action', async () => {
      prisma.incidentReport.findFirst.mockResolvedValue(mockIncident)
      prisma.incidentReport.update.mockResolvedValue({
        ...mockIncident,
        status: 'CLOSED',
        correctiveAction: 'Tether kits distributed.',
      })
      const result = await safetyService.updateIncidentReport(fastify, 'incident-1', ORG_ID, {
        status: 'CLOSED',
        correctiveAction: 'Tether kits distributed.',
      })
      expect(result.status).toBe('CLOSED')
      expect(result.correctiveAction).toBe('Tether kits distributed.')
    })
  })

  describe('deleteIncidentReport', () => {
    it('deletes the report', async () => {
      prisma.incidentReport.findFirst.mockResolvedValue(mockIncident)
      prisma.incidentReport.delete.mockResolvedValue(mockIncident)
      await safetyService.deleteIncidentReport(fastify, 'incident-1', ORG_ID)
      expect(prisma.incidentReport.delete).toHaveBeenCalledWith({ where: { id: 'incident-1' } })
    })
  })
})
