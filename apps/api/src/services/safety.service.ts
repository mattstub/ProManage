import { MINIO_BUCKET_NAME, parsePagination, buildPaginationMeta } from '@promanage/core'

import { NotFoundError } from '../lib/errors'

import type {
  CreateSafetyDocumentInput,
  UpdateSafetyDocumentInput,
  CreateSdsEntryInput,
  UpdateSdsEntryInput,
  CreateToolboxTalkInput,
  UpdateToolboxTalkInput,
  CreateToolboxTalkAttendeeInput,
  CreateSafetyFormInput,
  UpdateSafetyFormInput,
  CreateIncidentReportInput,
  UpdateIncidentReportInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const USER_SELECT = { id: true, firstName: true, lastName: true, email: true } as const
const PROJECT_SELECT = { id: true, name: true, number: true } as const

const TALK_INCLUDE = {
  project: { select: PROJECT_SELECT },
  conductedBy: { select: USER_SELECT },
  createdBy: { select: USER_SELECT },
  attendees: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: USER_SELECT } },
  },
} as const

// ─── Safety Documents ────────────────────────────────────────────────────────

export async function listSafetyDocuments(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string; category?: string }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.category && { category: query.category }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
        { fileName: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [documents, total] = await Promise.all([
    fastify.prisma.safetyDocument.findMany({
      where,
      include: { uploadedBy: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.safetyDocument.count({ where }),
  ])

  return { documents, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getSafetyDocument(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const doc = await fastify.prisma.safetyDocument.findFirst({
    where: { id, organizationId },
    include: { uploadedBy: { select: USER_SELECT } },
  })
  if (!doc) throw new NotFoundError('Safety document not found')
  return doc
}

export async function createSafetyDocument(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateSafetyDocumentInput,
  uploadedById: string
) {
  return fastify.prisma.safetyDocument.create({
    data: {
      organizationId,
      uploadedById,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? 'POLICY',
      fileName: input.fileName,
      fileKey: input.fileKey,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
    },
    include: { uploadedBy: { select: USER_SELECT } },
  })
}

export async function updateSafetyDocument(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateSafetyDocumentInput
) {
  const existing = await fastify.prisma.safetyDocument.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Safety document not found')

  return fastify.prisma.safetyDocument.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
    },
    include: { uploadedBy: { select: USER_SELECT } },
  })
}

export async function deleteSafetyDocument(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const doc = await fastify.prisma.safetyDocument.findFirst({ where: { id, organizationId } })
  if (!doc) throw new NotFoundError('Safety document not found')

  try {
    await fastify.minio.removeObject(MINIO_BUCKET_NAME, doc.fileKey)
  } catch {
    // best-effort: don't block delete if MinIO object already gone
  }

  await fastify.prisma.safetyDocument.delete({ where: { id } })
}

// ─── SDS Catalog ─────────────────────────────────────────────────────────────

export async function listSdsEntries(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.search && {
      OR: [
        { productName: { contains: query.search, mode: 'insensitive' as const } },
        { manufacturer: { contains: query.search, mode: 'insensitive' as const } },
        { chemicalName: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [entries, total] = await Promise.all([
    fastify.prisma.sdsEntry.findMany({
      where,
      include: { createdBy: { select: USER_SELECT } },
      orderBy: { productName: 'asc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.sdsEntry.count({ where }),
  ])

  return { entries, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getSdsEntry(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const entry = await fastify.prisma.sdsEntry.findFirst({
    where: { id, organizationId },
    include: { createdBy: { select: USER_SELECT } },
  })
  if (!entry) throw new NotFoundError('SDS entry not found')
  return entry
}

export async function createSdsEntry(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateSdsEntryInput,
  createdById: string
) {
  return fastify.prisma.sdsEntry.create({
    data: {
      organizationId,
      createdById,
      productName: input.productName,
      manufacturer: input.manufacturer ?? null,
      chemicalName: input.chemicalName ?? null,
      sdsFileKey: input.sdsFileKey ?? null,
      sdsFileName: input.sdsFileName ?? null,
      reviewDate: input.reviewDate ? new Date(input.reviewDate) : null,
      notes: input.notes ?? null,
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function updateSdsEntry(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateSdsEntryInput
) {
  const existing = await fastify.prisma.sdsEntry.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('SDS entry not found')

  return fastify.prisma.sdsEntry.update({
    where: { id },
    data: {
      ...(input.productName !== undefined && { productName: input.productName }),
      ...(input.manufacturer !== undefined && { manufacturer: input.manufacturer }),
      ...(input.chemicalName !== undefined && { chemicalName: input.chemicalName }),
      ...(input.sdsFileKey !== undefined && { sdsFileKey: input.sdsFileKey }),
      ...(input.sdsFileName !== undefined && { sdsFileName: input.sdsFileName }),
      ...(input.reviewDate !== undefined && {
        reviewDate: input.reviewDate ? new Date(input.reviewDate) : null,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function deleteSdsEntry(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const entry = await fastify.prisma.sdsEntry.findFirst({ where: { id, organizationId } })
  if (!entry) throw new NotFoundError('SDS entry not found')

  if (entry.sdsFileKey) {
    try {
      await fastify.minio.removeObject(MINIO_BUCKET_NAME, entry.sdsFileKey)
    } catch {
      // best-effort
    }
  }

  await fastify.prisma.sdsEntry.delete({ where: { id } })
}

// ─── Toolbox Talks ───────────────────────────────────────────────────────────

export async function listToolboxTalks(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string; status?: string; projectId?: string }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.status && { status: query.status }),
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { content: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [talks, total] = await Promise.all([
    fastify.prisma.toolboxTalk.findMany({
      where,
      include: TALK_INCLUDE,
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: perPage,
    }),
    fastify.prisma.toolboxTalk.count({ where }),
  ])

  return { talks, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getToolboxTalk(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const talk = await fastify.prisma.toolboxTalk.findFirst({
    where: { id, organizationId },
    include: TALK_INCLUDE,
  })
  if (!talk) throw new NotFoundError('Toolbox talk not found')
  return talk
}

export async function createToolboxTalk(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateToolboxTalkInput,
  createdById: string
) {
  return fastify.prisma.toolboxTalk.create({
    data: {
      organizationId,
      createdById,
      title: input.title,
      content: input.content ?? null,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      projectId: input.projectId ?? null,
    },
    include: TALK_INCLUDE,
  })
}

export async function updateToolboxTalk(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateToolboxTalkInput
) {
  const existing = await fastify.prisma.toolboxTalk.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Toolbox talk not found')

  return fastify.prisma.toolboxTalk.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.scheduledDate !== undefined && {
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
      }),
      ...(input.conductedDate !== undefined && {
        conductedDate: input.conductedDate ? new Date(input.conductedDate) : null,
      }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.conductedById !== undefined && { conductedById: input.conductedById }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
    },
    include: TALK_INCLUDE,
  })
}

export async function deleteToolboxTalk(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await fastify.prisma.toolboxTalk.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Toolbox talk not found')
  await fastify.prisma.toolboxTalk.delete({ where: { id } })
}

export async function addAttendee(
  fastify: FastifyInstance,
  talkId: string,
  organizationId: string,
  input: CreateToolboxTalkAttendeeInput
) {
  const talk = await fastify.prisma.toolboxTalk.findFirst({ where: { id: talkId, organizationId } })
  if (!talk) throw new NotFoundError('Toolbox talk not found')

  return fastify.prisma.toolboxTalkAttendee.create({
    data: {
      talkId,
      name: input.name,
      userId: input.userId ?? null,
      signedAt: input.signedAt ? new Date(input.signedAt) : null,
    },
    include: { user: { select: USER_SELECT } },
  })
}

export async function removeAttendee(
  fastify: FastifyInstance,
  attendeeId: string,
  talkId: string,
  organizationId: string
) {
  const attendee = await fastify.prisma.toolboxTalkAttendee.findFirst({
    where: { id: attendeeId, talkId, talk: { organizationId } },
  })
  if (!attendee) throw new NotFoundError('Attendee not found')
  await fastify.prisma.toolboxTalkAttendee.delete({ where: { id: attendeeId } })
}

// ─── Safety Forms ────────────────────────────────────────────────────────────

export async function listSafetyForms(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: number; limit?: number; search?: string; category?: string; isActive?: boolean }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.category && { category: query.category }),
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [forms, total] = await Promise.all([
    fastify.prisma.safetyForm.findMany({
      where,
      include: { createdBy: { select: USER_SELECT } },
      orderBy: [{ isActive: 'desc' }, { title: 'asc' }],
      skip,
      take: perPage,
    }),
    fastify.prisma.safetyForm.count({ where }),
  ])

  return { forms, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getSafetyForm(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const form = await fastify.prisma.safetyForm.findFirst({
    where: { id, organizationId },
    include: { createdBy: { select: USER_SELECT } },
  })
  if (!form) throw new NotFoundError('Safety form not found')
  return form
}

export async function createSafetyForm(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateSafetyFormInput,
  createdById: string
) {
  return fastify.prisma.safetyForm.create({
    data: {
      organizationId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      category: input.category ?? 'INSPECTION',
      content: input.content ?? '',
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function updateSafetyForm(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateSafetyFormInput
) {
  const existing = await fastify.prisma.safetyForm.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Safety form not found')

  return fastify.prisma.safetyForm.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: { createdBy: { select: USER_SELECT } },
  })
}

export async function deleteSafetyForm(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await fastify.prisma.safetyForm.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Safety form not found')
  await fastify.prisma.safetyForm.delete({ where: { id } })
}

// ─── Incident Reports ────────────────────────────────────────────────────────

const INCIDENT_INCLUDE = {
  project: { select: PROJECT_SELECT },
  reportedBy: { select: USER_SELECT },
} as const

export async function listIncidentReports(
  fastify: FastifyInstance,
  organizationId: string,
  query: {
    page?: number
    limit?: number
    search?: string
    status?: string
    incidentType?: string
    projectId?: string
  }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.status && { status: query.status }),
    ...(query.incidentType && { incidentType: query.incidentType }),
    ...(query.projectId && { projectId: query.projectId }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
        { location: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [reports, total] = await Promise.all([
    fastify.prisma.incidentReport.findMany({
      where,
      include: INCIDENT_INCLUDE,
      orderBy: { incidentDate: 'desc' },
      skip,
      take: perPage,
    }),
    fastify.prisma.incidentReport.count({ where }),
  ])

  return { reports, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getIncidentReport(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const report = await fastify.prisma.incidentReport.findFirst({
    where: { id, organizationId },
    include: INCIDENT_INCLUDE,
  })
  if (!report) throw new NotFoundError('Incident report not found')
  return report
}

export async function createIncidentReport(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateIncidentReportInput,
  reportedById: string
) {
  return fastify.prisma.incidentReport.create({
    data: {
      organizationId,
      reportedById,
      title: input.title,
      incidentType: input.incidentType,
      incidentDate: new Date(input.incidentDate),
      location: input.location ?? null,
      description: input.description,
      projectId: input.projectId ?? null,
    },
    include: INCIDENT_INCLUDE,
  })
}

export async function updateIncidentReport(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateIncidentReportInput
) {
  const existing = await fastify.prisma.incidentReport.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Incident report not found')

  return fastify.prisma.incidentReport.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.incidentType !== undefined && { incidentType: input.incidentType }),
      ...(input.incidentDate !== undefined && { incidentDate: new Date(input.incidentDate) }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.correctiveAction !== undefined && { correctiveAction: input.correctiveAction }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
    },
    include: INCIDENT_INCLUDE,
  })
}

export async function deleteIncidentReport(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await fastify.prisma.incidentReport.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('Incident report not found')
  await fastify.prisma.incidentReport.delete({ where: { id } })
}
