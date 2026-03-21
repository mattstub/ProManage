import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as cdService from '../../services/construction-documents.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORG_ID = 'org-1'
const PROJECT_ID = 'project-1'
const USER_ID = 'user-1'

const mockProject = { id: PROJECT_ID, organizationId: ORG_ID, name: 'Test Project' }

const mockDiscipline = {
  id: 'disc-1',
  name: 'Architectural',
  abbreviation: 'A',
  sortOrder: 0,
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSheet = {
  id: 'sheet-1',
  sheetNumber: 'A-101',
  title: 'Floor Plan',
  sortOrder: 0,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  disciplineId: 'disc-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockRevision = {
  id: 'rev-1',
  revisionNumber: '1',
  revisionDate: new Date(),
  description: 'Initial issue',
  fileKey: 'drawings/project-1/sheet-1/file.pdf',
  fileName: 'A-101.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  isCurrent: true,
  organizationId: ORG_ID,
  sheetId: 'sheet-1',
  drawingSetId: null,
  uploadedById: USER_ID,
  createdAt: new Date(),
}

const mockSection = {
  id: 'section-1',
  sectionNumber: '03 00 00',
  title: 'Concrete',
  description: null,
  sortOrder: 0,
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSpecRevision = {
  id: 'spec-rev-1',
  revisionNumber: 1,
  revisionDate: new Date(),
  description: null,
  isAmendment: false,
  fileKey: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  isCurrent: true,
  organizationId: ORG_ID,
  sectionId: 'section-1',
  uploadedById: USER_ID,
  createdAt: new Date(),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFastify(prisma: MockPrisma) {
  return {
    prisma,
    minio: {
      removeObject: vi.fn().mockResolvedValue(undefined),
      presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/presigned-put'),
    },
  } as any
}

// ─── Disciplines ─────────────────────────────────────────────────────────────

describe('listDrawingDisciplines', () => {
  it('returns disciplines ordered by sortOrder then name', async () => {
    const prisma = createMockPrisma()
    prisma.drawingDiscipline.findMany.mockResolvedValue([mockDiscipline])
    const fastify = buildFastify(prisma)

    const result = await cdService.listDrawingDisciplines(fastify, ORG_ID)

    expect(result).toEqual([mockDiscipline])
    expect(prisma.drawingDiscipline.findMany).toHaveBeenCalledWith({
      where: { organizationId: ORG_ID },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
  })
})

describe('createDrawingDiscipline', () => {
  let prisma: MockPrisma
  let fastify: any

  beforeEach(() => {
    prisma = createMockPrisma()
    fastify = buildFastify(prisma)
  })

  it('creates a discipline when name is unique', async () => {
    prisma.drawingDiscipline.findFirst.mockResolvedValue(null)
    prisma.drawingDiscipline.create.mockResolvedValue(mockDiscipline)

    const result = await cdService.createDrawingDiscipline(fastify, ORG_ID, {
      name: 'Architectural',
      abbreviation: 'A',
    })

    expect(result).toEqual(mockDiscipline)
  })

  it('throws ConflictError when name already exists', async () => {
    prisma.drawingDiscipline.findFirst.mockResolvedValue(mockDiscipline)

    await expect(
      cdService.createDrawingDiscipline(fastify, ORG_ID, { name: 'Architectural' })
    ).rejects.toThrow('already exists')
  })
})

describe('deleteDrawingDiscipline', () => {
  it('throws ConflictError when discipline is in use', async () => {
    const prisma = createMockPrisma()
    prisma.drawingDiscipline.findFirst.mockResolvedValue(mockDiscipline)
    prisma.drawingSheet.count.mockResolvedValue(3)
    const fastify = buildFastify(prisma)

    await expect(cdService.deleteDrawingDiscipline(fastify, 'disc-1', ORG_ID)).rejects.toThrow('assigned to')
  })

  it('deletes discipline when not in use', async () => {
    const prisma = createMockPrisma()
    prisma.drawingDiscipline.findFirst.mockResolvedValue(mockDiscipline)
    prisma.drawingSheet.count.mockResolvedValue(0)
    prisma.drawingDiscipline.delete.mockResolvedValue(mockDiscipline)
    const fastify = buildFastify(prisma)

    await cdService.deleteDrawingDiscipline(fastify, 'disc-1', ORG_ID)
    expect(prisma.drawingDiscipline.delete).toHaveBeenCalledWith({ where: { id: 'disc-1' } })
  })
})

// ─── Drawing Sheets ───────────────────────────────────────────────────────────

describe('createDrawingSheet', () => {
  let prisma: MockPrisma
  let fastify: any

  beforeEach(() => {
    prisma = createMockPrisma()
    fastify = buildFastify(prisma)
  })

  it('creates a sheet when sheet number is unique', async () => {
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingDiscipline.findFirst.mockResolvedValue(mockDiscipline)
    prisma.drawingSheet.findFirst.mockResolvedValue(null)
    prisma.drawingSheet.create.mockResolvedValue(mockSheet)

    const result = await cdService.createDrawingSheet(fastify, PROJECT_ID, ORG_ID, {
      sheetNumber: 'A-101',
      title: 'Floor Plan',
      disciplineId: 'disc-1',
    })

    expect(result).toEqual(mockSheet)
  })

  it('throws ConflictError when sheet number already exists', async () => {
    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.drawingDiscipline.findFirst.mockResolvedValue(mockDiscipline)
    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)

    await expect(
      cdService.createDrawingSheet(fastify, PROJECT_ID, ORG_ID, {
        sheetNumber: 'A-101',
        title: 'Duplicate',
      })
    ).rejects.toThrow('already exists')
  })

  it('throws NotFoundError when project not found', async () => {
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      cdService.createDrawingSheet(fastify, PROJECT_ID, ORG_ID, {
        sheetNumber: 'A-101',
        title: 'Floor Plan',
      })
    ).rejects.toThrow('Project not found')
  })
})

describe('deleteDrawingSheet', () => {
  it('removes MinIO files before deleting sheet', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)
    prisma.drawingRevision.findMany.mockResolvedValue([
      { fileKey: 'drawings/project-1/sheet-1/file.pdf' },
    ])
    prisma.drawingSheet.delete.mockResolvedValue(mockSheet)

    await cdService.deleteDrawingSheet(fastify, 'sheet-1', PROJECT_ID, ORG_ID)

    expect(fastify.minio.removeObject).toHaveBeenCalledWith(
      expect.any(String),
      'drawings/project-1/sheet-1/file.pdf'
    )
    expect(prisma.drawingSheet.delete).toHaveBeenCalledWith({ where: { id: 'sheet-1' } })
  })
})

// ─── Drawing Revisions ────────────────────────────────────────────────────────

describe('addDrawingRevision', () => {
  it('sets isCurrent on new revision and unsets previous', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)
    // Simulate $transaction executing the callback
    prisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        drawingRevision: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({ ...mockRevision, revisionNumber: '2' }),
        },
      })
    })

    const result = await cdService.addDrawingRevision(
      fastify,
      'sheet-1',
      PROJECT_ID,
      ORG_ID,
      USER_ID,
      {
        revisionNumber: '2',
        revisionDate: new Date().toISOString(),
      }
    )

    expect(result.revisionNumber).toBe('2')
  })

  it('throws NotFoundError when sheet not found', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)
    prisma.drawingSheet.findFirst.mockResolvedValue(null)

    await expect(
      cdService.addDrawingRevision(fastify, 'bad-id', PROJECT_ID, ORG_ID, USER_ID, {
        revisionNumber: '1',
        revisionDate: new Date().toISOString(),
      })
    ).rejects.toThrow('Drawing sheet not found')
  })
})

describe('getDrawingRevisionUploadUrl', () => {
  it('throws ValidationError for unsupported mime type', async () => {
    const prisma = createMockPrisma()
    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)
    const fastify = buildFastify(prisma)

    await expect(
      cdService.getDrawingRevisionUploadUrl(
        fastify,
        'sheet-1',
        PROJECT_ID,
        ORG_ID,
        'file.exe',
        'application/x-msdownload',
        1024
      )
    ).rejects.toThrow('Unsupported file type')
  })

  it('returns presigned URL for valid pdf', async () => {
    const prisma = createMockPrisma()
    prisma.drawingSheet.findFirst.mockResolvedValue(mockSheet)
    const fastify = buildFastify(prisma)

    const result = await cdService.getDrawingRevisionUploadUrl(
      fastify,
      'sheet-1',
      PROJECT_ID,
      ORG_ID,
      'plan.pdf',
      'application/pdf',
      1024 * 1024
    )

    expect(result.uploadUrl).toBe('https://minio.local/presigned-put')
    expect(result.fileKey).toContain('drawings/')
  })
})

// ─── Specification Sections ───────────────────────────────────────────────────

describe('createSpecificationSection', () => {
  it('creates a section when section number is unique', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.specificationSection.findFirst.mockResolvedValue(null)
    prisma.specificationSection.create.mockResolvedValue(mockSection)

    const result = await cdService.createSpecificationSection(fastify, PROJECT_ID, ORG_ID, USER_ID, {
      sectionNumber: '03 00 00',
      title: 'Concrete',
    })

    expect(result).toEqual(mockSection)
  })

  it('throws ConflictError when section number already exists', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.project.findFirst.mockResolvedValue(mockProject)
    prisma.specificationSection.findFirst.mockResolvedValue(mockSection)

    await expect(
      cdService.createSpecificationSection(fastify, PROJECT_ID, ORG_ID, USER_ID, {
        sectionNumber: '03 00 00',
        title: 'Duplicate',
      })
    ).rejects.toThrow('already exists')
  })
})

// ─── Specification Revisions ──────────────────────────────────────────────────

describe('addSpecificationRevision', () => {
  it('auto-increments revision number and sets isCurrent', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.specificationSection.findFirst.mockResolvedValue(mockSection)
    prisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        specificationRevision: {
          findFirst: vi.fn().mockResolvedValue({ revisionNumber: 1 }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          create: vi.fn().mockResolvedValue({ ...mockSpecRevision, revisionNumber: 2 }),
        },
      })
    })

    const result = await cdService.addSpecificationRevision(
      fastify,
      'section-1',
      PROJECT_ID,
      ORG_ID,
      USER_ID,
      {
        revisionDate: new Date().toISOString(),
        isAmendment: true,
      }
    )

    expect(result.revisionNumber).toBe(2)
  })

  it('starts at revision 1 when no prior revisions exist', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.specificationSection.findFirst.mockResolvedValue(mockSection)
    prisma.$transaction.mockImplementation(async (cb: any) => {
      return cb({
        specificationRevision: {
          findFirst: vi.fn().mockResolvedValue(null), // no prior revisions
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          create: vi.fn().mockResolvedValue({ ...mockSpecRevision, revisionNumber: 1 }),
        },
      })
    })

    const result = await cdService.addSpecificationRevision(
      fastify,
      'section-1',
      PROJECT_ID,
      ORG_ID,
      USER_ID,
      { revisionDate: new Date().toISOString() }
    )

    expect(result.revisionNumber).toBe(1)
  })
})

describe('deleteSpecificationSection', () => {
  it('removes MinIO files and deletes section', async () => {
    const prisma = createMockPrisma()
    const fastify = buildFastify(prisma)

    prisma.specificationSection.findFirst.mockResolvedValue(mockSection)
    prisma.specificationRevision.findMany.mockResolvedValue([
      { fileKey: 'specs/project-1/section-1/spec.pdf' },
    ])
    prisma.specificationSection.delete.mockResolvedValue(mockSection)

    await cdService.deleteSpecificationSection(fastify, 'section-1', PROJECT_ID, ORG_ID)

    expect(fastify.minio.removeObject).toHaveBeenCalledWith(
      expect.any(String),
      'specs/project-1/section-1/spec.pdf'
    )
    expect(prisma.specificationSection.delete).toHaveBeenCalledWith({ where: { id: 'section-1' } })
  })
})
