import { Prisma } from '@prisma/client'

import { ConflictError, NotFoundError } from '../lib/errors'

import type {
  CreateSubmittalDocumentInput,
  CreateSubmittalInput,
  UpdateSubmittalDocumentInput,
  UpdateSubmittalInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const SUBMITTAL_SELECT = {
  id: true,
  submittalNumber: true,
  specSection: true,
  title: true,
  description: true,
  type: true,
  status: true,
  revision: true,
  submittedDate: true,
  requiredByDate: true,
  returnedDate: true,
  ballInCourt: true,
  approver: true,
  notes: true,
  organizationId: true,
  projectId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, number: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const

const DOCUMENT_SELECT = {
  id: true,
  name: true,
  fileKey: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  notes: true,
  submittalId: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
} as const

export async function listSubmittals(
  app: FastifyInstance,
  organizationId: string,
  projectId: string
) {
  return app.prisma.submittal.findMany({
    where: { organizationId, projectId },
    select: { ...SUBMITTAL_SELECT, documents: { select: DOCUMENT_SELECT } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSubmittal(
  app: FastifyInstance,
  id: string,
  organizationId: string
) {
  const submittal = await app.prisma.submittal.findFirst({
    where: { id, organizationId },
    select: {
      ...SUBMITTAL_SELECT,
      documents: { select: DOCUMENT_SELECT, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!submittal) throw new NotFoundError('Submittal not found')
  return submittal
}

export async function createSubmittal(
  app: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateSubmittalInput
) {
  const project = await app.prisma.project.findFirst({
    where: { id: input.projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  try {
    return await app.prisma.submittal.create({
      data: {
        organizationId,
        projectId: input.projectId,
        createdById,
        submittalNumber: input.submittalNumber,
        specSection: input.specSection ?? null,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        revision: input.revision ?? 1,
        submittedDate: input.submittedDate ? new Date(input.submittedDate) : null,
        requiredByDate: input.requiredByDate ? new Date(input.requiredByDate) : null,
        returnedDate: input.returnedDate ? new Date(input.returnedDate) : null,
        ballInCourt: input.ballInCourt ?? null,
        approver: input.approver ?? null,
        notes: input.notes ?? null,
      },
      select: { ...SUBMITTAL_SELECT, documents: { select: DOCUMENT_SELECT } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Submittal number "${input.submittalNumber}" already exists`)
    }
    throw err
  }
}

export async function updateSubmittal(
  app: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateSubmittalInput
) {
  const existing = await app.prisma.submittal.findFirst({
    where: { id, organizationId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('Submittal not found')

  try {
    return await app.prisma.submittal.update({
      where: { id },
      data: {
        ...(input.submittalNumber !== undefined && { submittalNumber: input.submittalNumber }),
        ...(input.specSection !== undefined && { specSection: input.specSection }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.revision !== undefined && { revision: input.revision }),
        ...(input.submittedDate !== undefined && {
          submittedDate: input.submittedDate ? new Date(input.submittedDate) : null,
        }),
        ...(input.requiredByDate !== undefined && {
          requiredByDate: input.requiredByDate ? new Date(input.requiredByDate) : null,
        }),
        ...(input.returnedDate !== undefined && {
          returnedDate: input.returnedDate ? new Date(input.returnedDate) : null,
        }),
        ...(input.ballInCourt !== undefined && { ballInCourt: input.ballInCourt }),
        ...(input.approver !== undefined && { approver: input.approver }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      select: {
        ...SUBMITTAL_SELECT,
        documents: { select: DOCUMENT_SELECT, orderBy: { createdAt: 'asc' } },
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Submittal number "${input.submittalNumber}" already exists`)
    }
    throw err
  }
}

export async function deleteSubmittal(
  app: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await app.prisma.submittal.findFirst({
    where: { id, organizationId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('Submittal not found')
  await app.prisma.submittal.delete({ where: { id } })
}

// ── Documents ─────────────────────────────────────────────────────────────────

async function assertSubmittalAccess(
  app: FastifyInstance,
  submittalId: string,
  organizationId: string
) {
  const submittal = await app.prisma.submittal.findFirst({
    where: { id: submittalId, organizationId },
    select: { id: true },
  })
  if (!submittal) throw new NotFoundError('Submittal not found')
  return submittal
}

export async function listSubmittalDocuments(
  app: FastifyInstance,
  submittalId: string,
  organizationId: string
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  return app.prisma.submittalDocument.findMany({
    where: { submittalId },
    select: DOCUMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createSubmittalDocument(
  app: FastifyInstance,
  submittalId: string,
  organizationId: string,
  uploadedById: string,
  input: CreateSubmittalDocumentInput
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  return app.prisma.submittalDocument.create({
    data: {
      submittalId,
      name: input.name,
      notes: input.notes ?? null,
      uploadedById,
    },
    select: DOCUMENT_SELECT,
  })
}

export async function updateSubmittalDocument(
  app: FastifyInstance,
  submittalId: string,
  docId: string,
  organizationId: string,
  input: UpdateSubmittalDocumentInput
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  const doc = await app.prisma.submittalDocument.findFirst({
    where: { id: docId, submittalId },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError('Document not found')

  return app.prisma.submittalDocument.update({
    where: { id: docId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    select: DOCUMENT_SELECT,
  })
}

export async function deleteSubmittalDocument(
  app: FastifyInstance,
  submittalId: string,
  docId: string,
  organizationId: string
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  const doc = await app.prisma.submittalDocument.findFirst({
    where: { id: docId, submittalId },
    select: { id: true, fileKey: true },
  })
  if (!doc) throw new NotFoundError('Document not found')
  await app.prisma.submittalDocument.delete({ where: { id: docId } })
  return doc
}

export async function getSubmittalDocumentUploadUrl(
  app: FastifyInstance,
  submittalId: string,
  docId: string,
  organizationId: string
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  const doc = await app.prisma.submittalDocument.findFirst({
    where: { id: docId, submittalId },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError('Document not found')

  const fileKey = `submittals/${submittalId}/documents/${docId}`
  const url = await app.minio.presignedPutObject('promanage', fileKey, 3600)

  await app.prisma.submittalDocument.update({
    where: { id: docId },
    data: { fileKey },
  })

  return { url, fileKey }
}

export async function getSubmittalDocumentDownloadUrl(
  app: FastifyInstance,
  submittalId: string,
  docId: string,
  organizationId: string
) {
  await assertSubmittalAccess(app, submittalId, organizationId)
  const doc = await app.prisma.submittalDocument.findFirst({
    where: { id: docId, submittalId },
    select: { id: true, fileKey: true, fileName: true },
  })
  if (!doc) throw new NotFoundError('Document not found')
  if (!doc.fileKey) throw new NotFoundError('No file uploaded for this document')

  const url = await app.minio.presignedGetObject('promanage', doc.fileKey, 3600)
  return { url }
}
