import { MINIO_BUCKET_NAME, parsePagination, buildPaginationMeta } from '@promanage/core'

import { NotFoundError, ValidationError } from '../lib/errors'

import type {
  CreateLicenseInput,
  UpdateLicenseInput,
  CreateLicenseReminderInput,
  UpdateLicenseReminderInput,
  UpdateLicenseReminderInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const LICENSE_INCLUDE = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  documents: { orderBy: { createdAt: 'desc' as const } },
  reminders: {
    orderBy: { daysBeforeExpiration: 'desc' as const },
    include: {
      notifyUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      notifySupervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const

export async function listLicenses(
  fastify: FastifyInstance,
  organizationId: string,
  query: {
    page?: number
    limit?: number
    search?: string
    holderType?: string
    status?: string
    userId?: string
  }
) {
  const { page, perPage, skip } = parsePagination({ page: query.page, perPage: query.limit })

  const where = {
    organizationId,
    ...(query.holderType && { holderType: query.holderType }),
    ...(query.status && { status: query.status }),
    ...(query.userId && { userId: query.userId }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { licenseNumber: { contains: query.search, mode: 'insensitive' as const } },
        { authority: { contains: query.search, mode: 'insensitive' as const } },
        { licenseType: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [licenses, total] = await Promise.all([
    fastify.prisma.license.findMany({
      where,
      include: LICENSE_INCLUDE,
      orderBy: [{ expirationDate: 'asc' }, { name: 'asc' }],
      skip,
      take: perPage,
    }),
    fastify.prisma.license.count({ where }),
  ])

  return { licenses, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getLicense(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const license = await fastify.prisma.license.findFirst({
    where: { id, organizationId },
    include: LICENSE_INCLUDE,
  })
  if (!license) throw new NotFoundError('License not found')
  return license
}

export async function createLicense(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateLicenseInput,
  createdById: string
) {
  if (input.holderType === 'USER' && !input.userId) {
    throw new ValidationError('userId is required when holderType is USER')
  }
  if (input.holderType === 'ORGANIZATION' && input.userId) {
    throw new ValidationError('userId must not be set when holderType is ORGANIZATION')
  }

  return fastify.prisma.license.create({
    data: {
      organizationId,
      createdById,
      name: input.name,
      licenseNumber: input.licenseNumber ?? null,
      authority: input.authority ?? null,
      licenseType: input.licenseType ?? null,
      holderType: input.holderType,
      userId: input.userId ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
      renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
      status: input.status ?? 'ACTIVE',
      notes: input.notes ?? null,
    },
    include: LICENSE_INCLUDE,
  })
}

export async function updateLicense(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateLicenseInput
) {
  const existing = await fastify.prisma.license.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('License not found')

  if (input.holderType === 'USER' && input.userId === undefined && !existing.userId) {
    throw new ValidationError('userId is required when holderType is USER')
  }
  if (input.holderType === 'ORGANIZATION' && input.userId) {
    throw new ValidationError('userId must not be set when holderType is ORGANIZATION')
  }

  const newExpiration = input.expirationDate !== undefined
    ? (input.expirationDate ? new Date(input.expirationDate) : null)
    : undefined

  // If expiration date changed, reset all reminder lastNotifiedAt so cycle restarts
  const expirationChanged = newExpiration !== undefined &&
    newExpiration?.toISOString() !== existing.expirationDate?.toISOString()

  const [license] = await fastify.prisma.$transaction(async (tx) => {
    const updated = await tx.license.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.licenseNumber !== undefined && { licenseNumber: input.licenseNumber }),
        ...(input.authority !== undefined && { authority: input.authority }),
        ...(input.licenseType !== undefined && { licenseType: input.licenseType }),
        ...(input.holderType !== undefined && { holderType: input.holderType }),
        // When switching to ORGANIZATION, always clear userId; otherwise apply input.userId if provided
        ...(input.holderType === 'ORGANIZATION'
          ? { userId: null }
          : input.userId !== undefined && { userId: input.userId }),
        ...(input.startDate !== undefined && {
          startDate: input.startDate ? new Date(input.startDate) : null,
        }),
        ...(newExpiration !== undefined && { expirationDate: newExpiration }),
        ...(input.renewalDate !== undefined && {
          renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: LICENSE_INCLUDE,
    })

    if (expirationChanged) {
      await tx.licenseReminder.updateMany({
        where: { licenseId: id },
        data: { lastNotifiedAt: null },
      })
    }

    return [updated]
  })

  return license
}

export async function deleteLicense(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const existing = await fastify.prisma.license.findFirst({ where: { id, organizationId } })
  if (!existing) throw new NotFoundError('License not found')

  // Delete MinIO documents before DB delete
  const documents = await fastify.prisma.licenseDocument.findMany({ where: { licenseId: id } })
  for (const doc of documents) {
    try {
      await fastify.minio.removeObject(MINIO_BUCKET_NAME, doc.fileKey)
    } catch {
      // best-effort: don't block delete if MinIO object already gone
    }
  }

  await fastify.prisma.license.delete({ where: { id } })
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function addLicenseDocument(
  fastify: FastifyInstance,
  licenseId: string,
  organizationId: string,
  file: {
    fileName: string
    fileKey: string
    fileUrl: string
    fileSize: number
    mimeType: string
    documentTag?: string
  },
  uploadedById: string
) {
  const license = await fastify.prisma.license.findFirst({ where: { id: licenseId, organizationId } })
  if (!license) throw new NotFoundError('License not found')

  return fastify.prisma.licenseDocument.create({
    data: {
      licenseId,
      uploadedById,
      fileName: file.fileName,
      fileKey: file.fileKey,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      documentTag: file.documentTag ?? null,
    },
  })
}

export async function deleteLicenseDocument(
  fastify: FastifyInstance,
  docId: string,
  licenseId: string,
  organizationId: string
) {
  const doc = await fastify.prisma.licenseDocument.findFirst({
    where: { id: docId, licenseId, license: { organizationId } },
  })
  if (!doc) throw new NotFoundError('Document not found')

  try {
    await fastify.minio.removeObject(MINIO_BUCKET_NAME, doc.fileKey)
  } catch {
    // best-effort
  }

  await fastify.prisma.licenseDocument.delete({ where: { id: docId } })
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export async function createReminder(
  fastify: FastifyInstance,
  licenseId: string,
  organizationId: string,
  input: CreateLicenseReminderInput
) {
  const license = await fastify.prisma.license.findFirst({ where: { id: licenseId, organizationId } })
  if (!license) throw new NotFoundError('License not found')

  return fastify.prisma.licenseReminder.create({
    data: {
      licenseId,
      daysBeforeExpiration: input.daysBeforeExpiration,
      notifyUserId: input.notifyUserId,
      notifySupervisorId: input.notifySupervisorId ?? null,
      isActive: input.isActive ?? true,
    },
    include: {
      notifyUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      notifySupervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })
}

export async function updateReminder(
  fastify: FastifyInstance,
  reminderId: string,
  licenseId: string,
  organizationId: string,
  input: UpdateLicenseReminderInput
) {
  const reminder = await fastify.prisma.licenseReminder.findFirst({
    where: { id: reminderId, licenseId, license: { organizationId } },
  })
  if (!reminder) throw new NotFoundError('Reminder not found')

  return fastify.prisma.licenseReminder.update({
    where: { id: reminderId },
    data: {
      ...(input.daysBeforeExpiration !== undefined && { daysBeforeExpiration: input.daysBeforeExpiration }),
      ...(input.notifyUserId !== undefined && { notifyUserId: input.notifyUserId }),
      ...(input.notifySupervisorId !== undefined && { notifySupervisorId: input.notifySupervisorId }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    include: {
      notifyUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      notifySupervisor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })
}

export async function deleteReminder(
  fastify: FastifyInstance,
  reminderId: string,
  licenseId: string,
  organizationId: string
) {
  const reminder = await fastify.prisma.licenseReminder.findFirst({
    where: { id: reminderId, licenseId, license: { organizationId } },
  })
  if (!reminder) throw new NotFoundError('Reminder not found')
  await fastify.prisma.licenseReminder.delete({ where: { id: reminderId } })
}
