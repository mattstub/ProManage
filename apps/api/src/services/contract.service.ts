import { Prisma } from '@prisma/client'

import { ConflictError, NotFoundError } from '../lib/errors'

import type {
  CreateContractDocumentInput,
  CreateContractInput,
  UpdateContractDocumentInput,
  UpdateContractInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const CONTRACT_SELECT = {
  id: true,
  contractNumber: true,
  type: true,
  status: true,
  amount: true,
  customerProjectNumber: true,
  retentionRate: true,
  wageRequirements: true,
  taxStatus: true,
  liquidatedDamages: true,
  liquidatedDamagesRate: true,
  bonded: true,
  billingDate: true,
  startDate: true,
  executedDate: true,
  description: true,
  notes: true,
  organizationId: true,
  projectId: true,
  proposalId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, number: true } },
  proposal: { select: { id: true, title: true, proposalNumber: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const

const DOCUMENT_SELECT = {
  id: true,
  type: true,
  name: true,
  status: true,
  fileKey: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  notes: true,
  expiresAt: true,
  receivedAt: true,
  contractId: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: { select: { id: true, firstName: true, lastName: true } },
} as const

export async function listContracts(
  app: FastifyInstance,
  organizationId: string,
  projectId: string
) {
  return app.prisma.contract.findMany({
    where: { organizationId, projectId },
    select: { ...CONTRACT_SELECT, documents: { select: DOCUMENT_SELECT } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getContract(
  app: FastifyInstance,
  id: string,
  organizationId: string
) {
  const contract = await app.prisma.contract.findFirst({
    where: { id, organizationId },
    select: { ...CONTRACT_SELECT, documents: { select: DOCUMENT_SELECT, orderBy: { createdAt: 'asc' } } },
  })
  if (!contract) throw new NotFoundError('Contract not found')
  return contract
}

export async function createContract(
  app: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateContractInput
) {
  // Verify project belongs to org
  const project = await app.prisma.project.findFirst({
    where: { id: input.projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  // Verify proposal if provided
  if (input.proposalId) {
    const proposal = await app.prisma.proposal.findFirst({
      where: { id: input.proposalId, organizationId },
      select: { id: true },
    })
    if (!proposal) throw new NotFoundError('Proposal not found')
  }

  try {
    return await app.prisma.contract.create({
      data: {
        organizationId,
        projectId: input.projectId,
        proposalId: input.proposalId ?? null,
        contractNumber: input.contractNumber,
        type: input.type,
        amount: new Prisma.Decimal(input.amount),
        customerProjectNumber: input.customerProjectNumber ?? null,
        retentionRate: input.retentionRate != null ? new Prisma.Decimal(input.retentionRate) : null,
        wageRequirements: input.wageRequirements ?? null,
        taxStatus: input.taxStatus ?? null,
        liquidatedDamages: input.liquidatedDamages ?? false,
        liquidatedDamagesRate: input.liquidatedDamagesRate != null
          ? new Prisma.Decimal(input.liquidatedDamagesRate)
          : null,
        bonded: input.bonded ?? false,
        billingDate: input.billingDate ? new Date(input.billingDate) : null,
        startDate: input.startDate ? new Date(input.startDate) : null,
        executedDate: input.executedDate ? new Date(input.executedDate) : null,
        description: input.description ?? null,
        notes: input.notes ?? null,
        createdById,
      },
      select: { ...CONTRACT_SELECT, documents: { select: DOCUMENT_SELECT } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Contract number "${input.contractNumber}" already exists`)
    }
    throw err
  }
}

export async function updateContract(
  app: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateContractInput
) {
  const existing = await app.prisma.contract.findFirst({
    where: { id, organizationId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('Contract not found')

  try {
    return await app.prisma.contract.update({
      where: { id },
      data: {
        ...(input.contractNumber !== undefined && { contractNumber: input.contractNumber }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.amount !== undefined && { amount: new Prisma.Decimal(input.amount) }),
        ...(input.customerProjectNumber !== undefined && { customerProjectNumber: input.customerProjectNumber }),
        ...(input.retentionRate !== undefined && {
          retentionRate: input.retentionRate != null ? new Prisma.Decimal(input.retentionRate) : null,
        }),
        ...(input.wageRequirements !== undefined && { wageRequirements: input.wageRequirements }),
        ...(input.taxStatus !== undefined && { taxStatus: input.taxStatus }),
        ...(input.liquidatedDamages !== undefined && { liquidatedDamages: input.liquidatedDamages }),
        ...(input.liquidatedDamagesRate !== undefined && {
          liquidatedDamagesRate: input.liquidatedDamagesRate != null
            ? new Prisma.Decimal(input.liquidatedDamagesRate)
            : null,
        }),
        ...(input.bonded !== undefined && { bonded: input.bonded }),
        ...(input.billingDate !== undefined && { billingDate: input.billingDate ? new Date(input.billingDate) : null }),
        ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
        ...(input.executedDate !== undefined && { executedDate: input.executedDate ? new Date(input.executedDate) : null }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      select: { ...CONTRACT_SELECT, documents: { select: DOCUMENT_SELECT, orderBy: { createdAt: 'asc' } } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Contract number "${input.contractNumber}" already exists`)
    }
    throw err
  }
}

export async function deleteContract(
  app: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await app.prisma.contract.findFirst({
    where: { id, organizationId },
    select: { id: true },
  })
  if (!existing) throw new NotFoundError('Contract not found')
  await app.prisma.contract.delete({ where: { id } })
}

// ── Documents ────────────────────────────────────────────────────────────────

async function assertContractAccess(
  app: FastifyInstance,
  contractId: string,
  organizationId: string
) {
  const contract = await app.prisma.contract.findFirst({
    where: { id: contractId, organizationId },
    select: { id: true },
  })
  if (!contract) throw new NotFoundError('Contract not found')
  return contract
}

export async function listContractDocuments(
  app: FastifyInstance,
  contractId: string,
  organizationId: string
) {
  await assertContractAccess(app, contractId, organizationId)
  return app.prisma.contractDocument.findMany({
    where: { contractId },
    select: DOCUMENT_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function createContractDocument(
  app: FastifyInstance,
  contractId: string,
  organizationId: string,
  uploadedById: string,
  input: CreateContractDocumentInput
) {
  await assertContractAccess(app, contractId, organizationId)
  return app.prisma.contractDocument.create({
    data: {
      contractId,
      type: input.type,
      name: input.name,
      notes: input.notes ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      uploadedById,
    },
    select: DOCUMENT_SELECT,
  })
}

export async function updateContractDocument(
  app: FastifyInstance,
  contractId: string,
  docId: string,
  organizationId: string,
  input: UpdateContractDocumentInput
) {
  await assertContractAccess(app, contractId, organizationId)
  const doc = await app.prisma.contractDocument.findFirst({
    where: { id: docId, contractId },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError('Document not found')

  return app.prisma.contractDocument.update({
    where: { id: docId },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }),
      ...(input.receivedAt !== undefined && { receivedAt: input.receivedAt ? new Date(input.receivedAt) : null }),
    },
    select: DOCUMENT_SELECT,
  })
}

export async function deleteContractDocument(
  app: FastifyInstance,
  contractId: string,
  docId: string,
  organizationId: string
) {
  await assertContractAccess(app, contractId, organizationId)
  const doc = await app.prisma.contractDocument.findFirst({
    where: { id: docId, contractId },
    select: { id: true, fileKey: true },
  })
  if (!doc) throw new NotFoundError('Document not found')
  await app.prisma.contractDocument.delete({ where: { id: docId } })
  return doc
}

export async function getContractDocumentUploadUrl(
  app: FastifyInstance,
  contractId: string,
  docId: string,
  organizationId: string
) {
  await assertContractAccess(app, contractId, organizationId)
  const doc = await app.prisma.contractDocument.findFirst({
    where: { id: docId, contractId },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError('Document not found')

  const fileKey = `contracts/${contractId}/documents/${docId}`
  const url = await app.minio.presignedPutObject('promanage', fileKey, 3600)

  await app.prisma.contractDocument.update({
    where: { id: docId },
    data: { fileKey },
  })

  return { url, fileKey }
}

export async function getContractDocumentDownloadUrl(
  app: FastifyInstance,
  contractId: string,
  docId: string,
  organizationId: string
) {
  await assertContractAccess(app, contractId, organizationId)
  const doc = await app.prisma.contractDocument.findFirst({
    where: { id: docId, contractId },
    select: { id: true, fileKey: true, fileName: true },
  })
  if (!doc) throw new NotFoundError('Document not found')
  if (!doc.fileKey) throw new NotFoundError('No file uploaded for this document')

  const url = await app.minio.presignedGetObject('promanage', doc.fileKey, 3600)
  return { url }
}
