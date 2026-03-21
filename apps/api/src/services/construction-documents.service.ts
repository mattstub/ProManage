import {
  ALLOWED_DRAWING_MIME_TYPES,
  MAX_DRAWING_FILE_SIZE_BYTES,
  MINIO_BUCKET_NAME,
} from '@promanage/core'

import { ConflictError, NotFoundError, ValidationError } from '../lib/errors'

import type {
  AddDrawingRevisionInput,
  AddSpecificationRevisionInput,
  CreateDrawingDisciplineInput,
  CreateDrawingSetInput,
  CreateDrawingSheetInput,
  CreateSpecificationSectionInput,
  UpdateDrawingDisciplineInput,
  UpdateDrawingSetInput,
  UpdateDrawingSheetInput,
  UpdateSpecificationSectionInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

// =============================================================================
// DISCIPLINES
// =============================================================================

export async function listDrawingDisciplines(fastify: FastifyInstance, organizationId: string) {
  return fastify.prisma.drawingDiscipline.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export async function createDrawingDiscipline(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateDrawingDisciplineInput
) {
  const existing = await fastify.prisma.drawingDiscipline.findFirst({
    where: { name: input.name, organizationId },
  })
  if (existing) throw new ConflictError(`Discipline "${input.name}" already exists`)

  return fastify.prisma.drawingDiscipline.create({
    data: {
      name: input.name,
      abbreviation: input.abbreviation ?? null,
      sortOrder: input.sortOrder ?? 0,
      organizationId,
    },
  })
}

export async function updateDrawingDiscipline(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateDrawingDisciplineInput
) {
  const existing = await fastify.prisma.drawingDiscipline.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Drawing discipline not found')

  if (input.name && input.name !== existing.name) {
    const conflict = await fastify.prisma.drawingDiscipline.findFirst({
      where: { name: input.name, organizationId, NOT: { id } },
    })
    if (conflict) throw new ConflictError(`Discipline "${input.name}" already exists`)
  }

  return fastify.prisma.drawingDiscipline.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.abbreviation !== undefined && { abbreviation: input.abbreviation }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteDrawingDiscipline(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await fastify.prisma.drawingDiscipline.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Drawing discipline not found')

  const inUse = await fastify.prisma.drawingSheet.count({ where: { disciplineId: id } })
  if (inUse > 0) {
    throw new ConflictError('Cannot delete discipline — it is assigned to one or more drawing sheets')
  }

  await fastify.prisma.drawingDiscipline.delete({ where: { id } })
}

// =============================================================================
// DRAWING SETS
// =============================================================================

async function assertProjectAccess(fastify: FastifyInstance, projectId: string, organizationId: string) {
  const project = await fastify.prisma.project.findFirst({ where: { id: projectId, organizationId } })
  if (!project) throw new NotFoundError('Project not found')
  return project
}

export async function listDrawingSets(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await assertProjectAccess(fastify, projectId, organizationId)
  return fastify.prisma.drawingSet.findMany({
    where: { projectId, organizationId },
    orderBy: [{ issueDate: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createDrawingSet(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  userId: string,
  input: CreateDrawingSetInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)
  return fastify.prisma.drawingSet.create({
    data: {
      name: input.name,
      phase: input.phase ?? 'CONSTRUCTION_DOCUMENTS',
      issueDate: input.issueDate ? new Date(input.issueDate) : null,
      issuedBy: input.issuedBy ?? null,
      description: input.description ?? null,
      projectId,
      organizationId,
      createdById: userId,
    },
  })
}

export async function updateDrawingSet(
  fastify: FastifyInstance,
  setId: string,
  projectId: string,
  organizationId: string,
  input: UpdateDrawingSetInput
) {
  const existing = await fastify.prisma.drawingSet.findFirst({
    where: { id: setId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Drawing set not found')

  return fastify.prisma.drawingSet.update({
    where: { id: setId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phase !== undefined && { phase: input.phase }),
      ...(input.issueDate !== undefined && { issueDate: input.issueDate ? new Date(input.issueDate) : null }),
      ...(input.issuedBy !== undefined && { issuedBy: input.issuedBy }),
      ...(input.description !== undefined && { description: input.description }),
    },
  })
}

export async function deleteDrawingSet(
  fastify: FastifyInstance,
  setId: string,
  projectId: string,
  organizationId: string
) {
  const existing = await fastify.prisma.drawingSet.findFirst({
    where: { id: setId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Drawing set not found')
  await fastify.prisma.drawingSet.delete({ where: { id: setId } })
}

// =============================================================================
// DRAWING SHEETS
// =============================================================================

export async function listDrawingSheets(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const sheets = await fastify.prisma.drawingSheet.findMany({
    where: { projectId, organizationId },
    include: {
      discipline: true,
      revisions: {
        where: { isCurrent: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { revisions: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { sheetNumber: 'asc' }],
  })

  return sheets.map((s) => ({
    ...s,
    currentRevision: s.revisions[0] ?? null,
    revisionCount: s._count.revisions,
    revisions: undefined,
    _count: undefined,
  }))
}

export async function createDrawingSheet(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: CreateDrawingSheetInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  if (input.disciplineId) {
    const discipline = await fastify.prisma.drawingDiscipline.findFirst({
      where: { id: input.disciplineId, organizationId },
    })
    if (!discipline) throw new NotFoundError('Drawing discipline not found')
  }

  const existing = await fastify.prisma.drawingSheet.findFirst({
    where: { sheetNumber: input.sheetNumber, projectId },
  })
  if (existing) throw new ConflictError(`Sheet number "${input.sheetNumber}" already exists on this project`)

  return fastify.prisma.drawingSheet.create({
    data: {
      sheetNumber: input.sheetNumber,
      title: input.title,
      disciplineId: input.disciplineId ?? null,
      sortOrder: input.sortOrder ?? 0,
      projectId,
      organizationId,
    },
  })
}

export async function updateDrawingSheet(
  fastify: FastifyInstance,
  sheetId: string,
  projectId: string,
  organizationId: string,
  input: UpdateDrawingSheetInput
) {
  const existing = await fastify.prisma.drawingSheet.findFirst({
    where: { id: sheetId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Drawing sheet not found')

  if (input.sheetNumber && input.sheetNumber !== existing.sheetNumber) {
    const conflict = await fastify.prisma.drawingSheet.findFirst({
      where: { sheetNumber: input.sheetNumber, projectId, NOT: { id: sheetId } },
    })
    if (conflict) throw new ConflictError(`Sheet number "${input.sheetNumber}" already exists on this project`)
  }

  if (input.disciplineId) {
    const discipline = await fastify.prisma.drawingDiscipline.findFirst({
      where: { id: input.disciplineId, organizationId },
    })
    if (!discipline) throw new NotFoundError('Drawing discipline not found')
  }

  return fastify.prisma.drawingSheet.update({
    where: { id: sheetId },
    data: {
      ...(input.sheetNumber !== undefined && { sheetNumber: input.sheetNumber }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.disciplineId !== undefined && { disciplineId: input.disciplineId }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteDrawingSheet(
  fastify: FastifyInstance,
  sheetId: string,
  projectId: string,
  organizationId: string
) {
  const existing = await fastify.prisma.drawingSheet.findFirst({
    where: { id: sheetId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Drawing sheet not found')

  // Clean up MinIO files before DB delete
  const revisions = await fastify.prisma.drawingRevision.findMany({
    where: { sheetId },
    select: { fileKey: true },
  })
  for (const rev of revisions) {
    if (rev.fileKey) {
      try {
        await fastify.minio.removeObject(MINIO_BUCKET_NAME, rev.fileKey)
      } catch {
        // best-effort
      }
    }
  }

  await fastify.prisma.drawingSheet.delete({ where: { id: sheetId } })
}

// =============================================================================
// DRAWING REVISIONS
// =============================================================================

export async function listDrawingRevisions(
  fastify: FastifyInstance,
  sheetId: string,
  projectId: string,
  organizationId: string
) {
  const sheet = await fastify.prisma.drawingSheet.findFirst({
    where: { id: sheetId, projectId, organizationId },
  })
  if (!sheet) throw new NotFoundError('Drawing sheet not found')

  return fastify.prisma.drawingRevision.findMany({
    where: { sheetId, organizationId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function addDrawingRevision(
  fastify: FastifyInstance,
  sheetId: string,
  projectId: string,
  organizationId: string,
  userId: string,
  input: AddDrawingRevisionInput
) {
  const sheet = await fastify.prisma.drawingSheet.findFirst({
    where: { id: sheetId, projectId, organizationId },
  })
  if (!sheet) throw new NotFoundError('Drawing sheet not found')

  if (input.drawingSetId) {
    const set = await fastify.prisma.drawingSet.findFirst({
      where: { id: input.drawingSetId, projectId, organizationId },
    })
    if (!set) throw new NotFoundError('Drawing set not found')
  }

  return fastify.prisma.$transaction(async (tx) => {
    // Unset isCurrent on all previous revisions for this sheet
    await tx.drawingRevision.updateMany({
      where: { sheetId, isCurrent: true },
      data: { isCurrent: false },
    })

    return tx.drawingRevision.create({
      data: {
        revisionNumber: input.revisionNumber,
        revisionDate: new Date(input.revisionDate),
        description: input.description ?? null,
        drawingSetId: input.drawingSetId ?? null,
        fileKey: input.fileKey ?? null,
        fileName: input.fileName ?? null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
        isCurrent: true,
        sheetId,
        organizationId,
        uploadedById: userId,
      },
    })
  })
}

export async function getDrawingRevisionUploadUrl(
  fastify: FastifyInstance,
  sheetId: string,
  projectId: string,
  organizationId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
) {
  const sheet = await fastify.prisma.drawingSheet.findFirst({
    where: { id: sheetId, projectId, organizationId },
  })
  if (!sheet) throw new NotFoundError('Drawing sheet not found')

  if (!(ALLOWED_DRAWING_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError(`Unsupported file type: ${mimeType}`)
  }
  if (fileSize <= 0) throw new ValidationError('File must not be empty')
  if (fileSize > MAX_DRAWING_FILE_SIZE_BYTES) {
    throw new ValidationError(`File exceeds maximum size of ${MAX_DRAWING_FILE_SIZE_BYTES / 1024 / 1024} MB`)
  }

  const fileKey = `drawings/${projectId}/${sheetId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, fileKey, 900)
  return { uploadUrl, fileKey, fileName, mimeType, fileSize }
}

export async function deleteDrawingRevision(
  fastify: FastifyInstance,
  revisionId: string,
  sheetId: string,
  organizationId: string
) {
  const revision = await fastify.prisma.drawingRevision.findFirst({
    where: { id: revisionId, sheetId, organizationId },
  })
  if (!revision) throw new NotFoundError('Drawing revision not found')

  if (revision.fileKey) {
    try {
      await fastify.minio.removeObject(MINIO_BUCKET_NAME, revision.fileKey)
    } catch {
      // best-effort
    }
  }

  await fastify.prisma.$transaction(async (tx) => {
    await tx.drawingRevision.delete({ where: { id: revisionId } })

    // If this was the current revision, promote the next most recent
    if (revision.isCurrent) {
      const next = await tx.drawingRevision.findFirst({
        where: { sheetId, organizationId },
        orderBy: { createdAt: 'desc' },
      })
      if (next) {
        await tx.drawingRevision.update({ where: { id: next.id }, data: { isCurrent: true } })
      }
    }
  })
}

// =============================================================================
// SPECIFICATION SECTIONS
// =============================================================================

export async function listSpecificationSections(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const sections = await fastify.prisma.specificationSection.findMany({
    where: { projectId, organizationId },
    include: {
      revisions: {
        where: { isCurrent: true },
        take: 1,
      },
      _count: { select: { revisions: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { sectionNumber: 'asc' }],
  })

  return sections.map((s) => ({
    ...s,
    currentRevision: s.revisions[0] ?? null,
    revisionCount: s._count.revisions,
    revisions: undefined,
    _count: undefined,
  }))
}

export async function createSpecificationSection(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  userId: string,
  input: CreateSpecificationSectionInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const existing = await fastify.prisma.specificationSection.findFirst({
    where: { sectionNumber: input.sectionNumber, projectId },
  })
  if (existing) throw new ConflictError(`Section "${input.sectionNumber}" already exists on this project`)

  return fastify.prisma.specificationSection.create({
    data: {
      sectionNumber: input.sectionNumber,
      title: input.title,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
      projectId,
      organizationId,
      createdById: userId,
    },
  })
}

export async function updateSpecificationSection(
  fastify: FastifyInstance,
  sectionId: string,
  projectId: string,
  organizationId: string,
  input: UpdateSpecificationSectionInput
) {
  const existing = await fastify.prisma.specificationSection.findFirst({
    where: { id: sectionId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Specification section not found')

  if (input.sectionNumber && input.sectionNumber !== existing.sectionNumber) {
    const conflict = await fastify.prisma.specificationSection.findFirst({
      where: { sectionNumber: input.sectionNumber, projectId, NOT: { id: sectionId } },
    })
    if (conflict) throw new ConflictError(`Section "${input.sectionNumber}" already exists on this project`)
  }

  return fastify.prisma.specificationSection.update({
    where: { id: sectionId },
    data: {
      ...(input.sectionNumber !== undefined && { sectionNumber: input.sectionNumber }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteSpecificationSection(
  fastify: FastifyInstance,
  sectionId: string,
  projectId: string,
  organizationId: string
) {
  const existing = await fastify.prisma.specificationSection.findFirst({
    where: { id: sectionId, projectId, organizationId },
  })
  if (!existing) throw new NotFoundError('Specification section not found')

  // Clean up MinIO files
  const revisions = await fastify.prisma.specificationRevision.findMany({
    where: { sectionId },
    select: { fileKey: true },
  })
  for (const rev of revisions) {
    if (rev.fileKey) {
      try {
        await fastify.minio.removeObject(MINIO_BUCKET_NAME, rev.fileKey)
      } catch {
        // best-effort
      }
    }
  }

  await fastify.prisma.specificationSection.delete({ where: { id: sectionId } })
}

// =============================================================================
// SPECIFICATION REVISIONS
// =============================================================================

export async function listSpecificationRevisions(
  fastify: FastifyInstance,
  sectionId: string,
  projectId: string,
  organizationId: string
) {
  const section = await fastify.prisma.specificationSection.findFirst({
    where: { id: sectionId, projectId, organizationId },
  })
  if (!section) throw new NotFoundError('Specification section not found')

  return fastify.prisma.specificationRevision.findMany({
    where: { sectionId, organizationId },
    orderBy: { revisionNumber: 'desc' },
  })
}

export async function addSpecificationRevision(
  fastify: FastifyInstance,
  sectionId: string,
  projectId: string,
  organizationId: string,
  userId: string,
  input: AddSpecificationRevisionInput
) {
  const section = await fastify.prisma.specificationSection.findFirst({
    where: { id: sectionId, projectId, organizationId },
  })
  if (!section) throw new NotFoundError('Specification section not found')

  return fastify.prisma.$transaction(async (tx) => {
    // Find next revision number
    const last = await tx.specificationRevision.findFirst({
      where: { sectionId },
      orderBy: { revisionNumber: 'desc' },
      select: { revisionNumber: true },
    })
    const nextRevNum = (last?.revisionNumber ?? 0) + 1

    // Unset isCurrent on all previous revisions
    await tx.specificationRevision.updateMany({
      where: { sectionId, isCurrent: true },
      data: { isCurrent: false },
    })

    return tx.specificationRevision.create({
      data: {
        revisionNumber: nextRevNum,
        revisionDate: new Date(input.revisionDate),
        description: input.description ?? null,
        isAmendment: input.isAmendment ?? false,
        fileKey: input.fileKey ?? null,
        fileName: input.fileName ?? null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
        isCurrent: true,
        sectionId,
        organizationId,
        uploadedById: userId,
      },
    })
  })
}

export async function getSpecificationRevisionUploadUrl(
  fastify: FastifyInstance,
  sectionId: string,
  projectId: string,
  organizationId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
) {
  const section = await fastify.prisma.specificationSection.findFirst({
    where: { id: sectionId, projectId, organizationId },
  })
  if (!section) throw new NotFoundError('Specification section not found')

  if (!(ALLOWED_DRAWING_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new ValidationError(`Unsupported file type: ${mimeType}`)
  }
  if (fileSize <= 0) throw new ValidationError('File must not be empty')
  if (fileSize > MAX_DRAWING_FILE_SIZE_BYTES) {
    throw new ValidationError(`File exceeds maximum size of ${MAX_DRAWING_FILE_SIZE_BYTES / 1024 / 1024} MB`)
  }

  const fileKey = `specs/${projectId}/${sectionId}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, fileKey, 900)
  return { uploadUrl, fileKey, fileName, mimeType, fileSize }
}

export async function deleteSpecificationRevision(
  fastify: FastifyInstance,
  revisionId: string,
  sectionId: string,
  organizationId: string
) {
  const revision = await fastify.prisma.specificationRevision.findFirst({
    where: { id: revisionId, sectionId, organizationId },
  })
  if (!revision) throw new NotFoundError('Specification revision not found')

  if (revision.fileKey) {
    try {
      await fastify.minio.removeObject(MINIO_BUCKET_NAME, revision.fileKey)
    } catch {
      // best-effort
    }
  }

  await fastify.prisma.$transaction(async (tx) => {
    await tx.specificationRevision.delete({ where: { id: revisionId } })

    // If this was current, promote the next most recent
    if (revision.isCurrent) {
      const next = await tx.specificationRevision.findFirst({
        where: { sectionId, organizationId },
        orderBy: { revisionNumber: 'desc' },
      })
      if (next) {
        await tx.specificationRevision.update({ where: { id: next.id }, data: { isCurrent: true } })
      }
    }
  })
}
