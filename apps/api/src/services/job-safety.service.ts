import { MINIO_BUCKET_NAME, parsePagination, buildPaginationMeta } from '@promanage/core'

import { ConflictError, NotFoundError } from '../lib/errors'

import type {
  AddProjectSdsEntryInput,
  CreateJobHazardAnalysisInput,
  CreateProjectEmergencyContactInput,
  UpdateJobHazardAnalysisInput,
  UpdateProjectEmergencyContactInput,
  UpdateProjectSdsEntryInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const USER_SELECT = { id: true, firstName: true, lastName: true, email: true } as const
const PROJECT_SELECT = { id: true, name: true, number: true } as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertProjectAccess(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')
}

// ─── Job Hazard Analyses ──────────────────────────────────────────────────────

export async function listJhas(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string; status?: string }
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    projectId,
    organizationId,
    ...(query.status && { status: query.status }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [jhas, total] = await Promise.all([
    fastify.prisma.jobHazardAnalysis.findMany({
      where,
      include: { createdBy: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.jobHazardAnalysis.count({ where }),
  ])

  return { jhas, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getJha(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const jha = await fastify.prisma.jobHazardAnalysis.findFirst({
    where: { id, projectId, organizationId },
    include: { createdBy: { select: USER_SELECT } },
  })
  if (!jha) throw new NotFoundError('JHA not found')
  return jha
}

export async function createJha(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  createdById: string,
  input: CreateJobHazardAnalysisInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  return fastify.prisma.jobHazardAnalysis.create({
    data: {
      projectId,
      organizationId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'DRAFT',
      fileKey: input.fileKey ?? null,
      fileName: input.fileName ?? null,
      fileSize: input.fileSize ?? null,
      mimeType: input.mimeType ?? null,
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function updateJha(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string,
  input: UpdateJobHazardAnalysisInput
) {
  const jha = await fastify.prisma.jobHazardAnalysis.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!jha) throw new NotFoundError('JHA not found')

  return fastify.prisma.jobHazardAnalysis.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.fileKey !== undefined && { fileKey: input.fileKey }),
      ...(input.fileName !== undefined && { fileName: input.fileName }),
      ...(input.fileSize !== undefined && { fileSize: input.fileSize }),
      ...(input.mimeType !== undefined && { mimeType: input.mimeType }),
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function deleteJha(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const jha = await fastify.prisma.jobHazardAnalysis.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!jha) throw new NotFoundError('JHA not found')

  await fastify.prisma.jobHazardAnalysis.delete({ where: { id } })
}

export async function getJhaUploadUrl(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  fileName: string,
  _mimeType: string
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { randomUUID } = await import('node:crypto')
  const objectKey = `orgs/${organizationId}/projects/${projectId}/jhas/${randomUUID()}-${fileName}`
  const uploadUrl = await fastify.minio.presignedPutObject(MINIO_BUCKET_NAME, objectKey, 900)
  return { uploadUrl, objectKey }
}

export async function getJhaDownloadUrl(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const jha = await getJha(fastify, id, projectId, organizationId)
  if (!jha.fileKey) throw new NotFoundError('No file attached to this JHA')

  const downloadUrl = await fastify.minio.presignedGetObject(MINIO_BUCKET_NAME, jha.fileKey, 900)
  return { downloadUrl, fileName: jha.fileName }
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export async function listEmergencyContacts(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  return fastify.prisma.projectEmergencyContact.findMany({
    where: { projectId, organizationId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function getEmergencyContact(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const contact = await fastify.prisma.projectEmergencyContact.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!contact) throw new NotFoundError('Emergency contact not found')
  return contact
}

export async function createEmergencyContact(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: CreateProjectEmergencyContactInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  return fastify.prisma.projectEmergencyContact.create({
    data: {
      projectId,
      organizationId,
      name: input.name,
      role: input.role ?? 'OTHER',
      phone: input.phone,
      address: input.address ?? null,
      notes: input.notes ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  })
}

export async function updateEmergencyContact(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string,
  input: UpdateProjectEmergencyContactInput
) {
  const contact = await fastify.prisma.projectEmergencyContact.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!contact) throw new NotFoundError('Emergency contact not found')

  return fastify.prisma.projectEmergencyContact.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  })
}

export async function deleteEmergencyContact(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const contact = await fastify.prisma.projectEmergencyContact.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!contact) throw new NotFoundError('Emergency contact not found')

  await fastify.prisma.projectEmergencyContact.delete({ where: { id } })
}

// ─── Project SDS Binder ───────────────────────────────────────────────────────

export async function listProjectSdsEntries(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string }
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    projectId,
    organizationId,
    ...(query.search && {
      sdsEntry: {
        OR: [
          { productName: { contains: query.search, mode: 'insensitive' as const } },
          { manufacturer: { contains: query.search, mode: 'insensitive' as const } },
          { chemicalName: { contains: query.search, mode: 'insensitive' as const } },
        ],
      },
    }),
  }

  const [entries, total] = await Promise.all([
    fastify.prisma.projectSdsEntry.findMany({
      where,
      include: { sdsEntry: true },
      orderBy: { addedAt: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.projectSdsEntry.count({ where }),
  ])

  return { entries, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function addProjectSdsEntry(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: AddProjectSdsEntryInput
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  // Verify the SDS entry exists in this org
  const sdsEntry = await fastify.prisma.sdsEntry.findFirst({
    where: { id: input.sdsEntryId, organizationId },
  })
  if (!sdsEntry) throw new NotFoundError('SDS entry not found')

  // Check for duplicate
  const existing = await fastify.prisma.projectSdsEntry.findUnique({
    where: { projectId_sdsEntryId: { projectId, sdsEntryId: input.sdsEntryId } },
  })
  if (existing) throw new ConflictError('This SDS entry is already in the project binder')

  return fastify.prisma.projectSdsEntry.create({
    data: {
      projectId,
      organizationId,
      sdsEntryId: input.sdsEntryId,
      notes: input.notes ?? null,
    },
    include: { sdsEntry: true },
  })
}

export async function updateProjectSdsEntry(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string,
  input: UpdateProjectSdsEntryInput
) {
  const entry = await fastify.prisma.projectSdsEntry.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!entry) throw new NotFoundError('Project SDS entry not found')

  return fastify.prisma.projectSdsEntry.update({
    where: { id },
    data: { ...(input.notes !== undefined && { notes: input.notes }) },
    include: { sdsEntry: true },
  })
}

export async function removeProjectSdsEntry(
  fastify: FastifyInstance,
  id: string,
  projectId: string,
  organizationId: string
) {
  const entry = await fastify.prisma.projectSdsEntry.findFirst({
    where: { id, projectId, organizationId },
  })
  if (!entry) throw new NotFoundError('Project SDS entry not found')

  await fastify.prisma.projectSdsEntry.delete({ where: { id } })
}

// ─── Project-scoped safety document / toolbox talk / incident views ──────────

export async function listProjectSafetyDocuments(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string; category?: string }
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    projectId,
    organizationId,
    ...(query.category && { category: query.category }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [documents, total] = await Promise.all([
    fastify.prisma.safetyDocument.findMany({
      where,
      include: {
        uploadedBy: { select: USER_SELECT },
        project: { select: PROJECT_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.safetyDocument.count({ where }),
  ])

  return { documents, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function listProjectToolboxTalks(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  query: { page?: number; limit?: number; status?: string }
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    projectId,
    organizationId,
    ...(query.status && { status: query.status }),
  }

  const [talks, total] = await Promise.all([
    fastify.prisma.toolboxTalk.findMany({
      where,
      include: {
        conductedBy: { select: USER_SELECT },
        createdBy: { select: USER_SELECT },
        attendees: {
          orderBy: { createdAt: 'asc' as const },
          include: { user: { select: USER_SELECT } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.toolboxTalk.count({ where }),
  ])

  return { talks, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function listProjectIncidentReports(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  query: { page?: number; limit?: number; status?: string; incidentType?: string }
) {
  await assertProjectAccess(fastify, projectId, organizationId)

  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    projectId,
    organizationId,
    ...(query.status && { status: query.status }),
    ...(query.incidentType && { incidentType: query.incidentType }),
  }

  const [reports, total] = await Promise.all([
    fastify.prisma.incidentReport.findMany({
      where,
      include: {
        reportedBy: { select: USER_SELECT },
        project: { select: PROJECT_SELECT },
      },
      orderBy: { incidentDate: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.incidentReport.count({ where }),
  ])

  return { reports, pagination: buildPaginationMeta(total, page, perPage) }
}
