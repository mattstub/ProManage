import { Prisma } from '@prisma/client'

import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { ConflictError, NotFoundError } from '../lib/errors'

import type {
  CreateCostCodeInput,
  CreateMaterialInput,
  UpdateCostCodeInput,
  UpdateMaterialInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'



const USER_SELECT = { id: true, firstName: true, lastName: true, email: true } as const
const COST_CODE_SELECT = { id: true, code: true, description: true } as const

const MATERIAL_INCLUDE = {
  costCode: { select: COST_CODE_SELECT },
  createdBy: { select: USER_SELECT },
} as const

const HISTORY_INCLUDE = {
  recordedBy: { select: USER_SELECT },
} as const

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

// ===========================================
// COST CODE
// ===========================================

export async function listCostCodes(
  fastify: FastifyInstance,
  organizationId: string,
  query: { search?: string; isActive?: boolean }
) {
  const where: Prisma.CostCodeWhereInput = { organizationId }
  if (query.isActive !== undefined) where.isActive = query.isActive
  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ]
  }
  return fastify.prisma.costCode.findMany({ where, orderBy: { code: 'asc' } })
}

export async function getCostCode(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const costCode = await fastify.prisma.costCode.findFirst({ where: { id, organizationId } })
  if (!costCode) throw new NotFoundError('Cost code not found')
  return costCode
}

export async function createCostCode(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateCostCodeInput
) {
  try {
    return await fastify.prisma.costCode.create({ data: { ...input, organizationId } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Cost code '${input.code}' already exists in this organization`)
    }
    throw err
  }
}

export async function updateCostCode(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateCostCodeInput
) {
  await getCostCode(fastify, id, organizationId)
  try {
    return await fastify.prisma.costCode.update({ where: { id }, data: input })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError(`Cost code '${input.code}' already exists in this organization`)
    }
    throw err
  }
}

export async function deleteCostCode(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getCostCode(fastify, id, organizationId)
  const count = await fastify.prisma.material.count({ where: { costCodeId: id } })
  if (count > 0) {
    throw new ConflictError(
      `This cost code is used by ${count} material${count === 1 ? '' : 's'}. Reassign or deactivate them first.`
    )
  }
  await fastify.prisma.costCode.delete({ where: { id } })
}

// ===========================================
// MATERIAL
// ===========================================

export async function listMaterials(
  fastify: FastifyInstance,
  organizationId: string,
  query: {
    page?: string
    perPage?: string
    search?: string
    unit?: string
    costCodeId?: string
    isActive?: boolean
  }
) {
  const { page, perPage } = parsePagination(query)

  const where: Prisma.MaterialWhereInput = { organizationId }
  if (query.unit) where.unit = query.unit
  if (query.costCodeId) where.costCodeId = query.costCodeId
  if (query.isActive !== undefined) where.isActive = query.isActive
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { supplier: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [total, materials] = await Promise.all([
    fastify.prisma.material.count({ where }),
    fastify.prisma.material.findMany({
      where,
      include: MATERIAL_INCLUDE,
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return { materials, pagination: buildPaginationMeta(total, page, perPage) }
}

export async function getMaterial(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const material = await fastify.prisma.material.findFirst({
    where: { id, organizationId },
    include: MATERIAL_INCLUDE,
  })
  if (!material) throw new NotFoundError('Material not found')
  return material
}

export async function createMaterial(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateMaterialInput,
  createdById: string
) {
  if (input.costCodeId) {
    const cc = await fastify.prisma.costCode.findFirst({
      where: { id: input.costCodeId, organizationId },
    })
    if (!cc) throw new NotFoundError('Cost code not found')
  }

  const material = await fastify.prisma.$transaction(async (tx) => {
    const mat = await tx.material.create({
      data: {
        name: input.name,
        description: input.description,
        sku: input.sku,
        unit: input.unit ?? 'EA',
        unitCost: new Prisma.Decimal(input.unitCost),
        supplier: input.supplier,
        notes: input.notes,
        organizationId,
        createdById,
        costCodeId: input.costCodeId ?? null,
        lastPricedAt: new Date(),
      },
      include: MATERIAL_INCLUDE,
    })
    await tx.materialPriceHistory.create({
      data: {
        materialId: mat.id,
        unitCost: new Prisma.Decimal(input.unitCost),
        supplier: input.supplier ?? null,
        recordedById: createdById,
      },
    })
    return mat
  })

  return material
}

export async function updateMaterial(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateMaterialInput,
  updatedById: string
) {
  const existing = await getMaterial(fastify, id, organizationId)

  if (input.costCodeId !== undefined && input.costCodeId !== null) {
    const cc = await fastify.prisma.costCode.findFirst({
      where: { id: input.costCodeId, organizationId },
    })
    if (!cc) throw new NotFoundError('Cost code not found')
  }

  const priceChanged =
    input.unitCost !== undefined &&
    !new Prisma.Decimal(input.unitCost).equals(existing.unitCost)

  const material = await fastify.prisma.$transaction(async (tx) => {
    if (priceChanged) {
      await tx.materialPriceHistory.create({
        data: {
          materialId: id,
          unitCost: new Prisma.Decimal(input.unitCost!),
          supplier: input.supplier ?? existing.supplier ?? null,
          recordedById: updatedById,
        },
      })
      const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS)
      await tx.materialPriceHistory.deleteMany({
        where: { materialId: id, recordedAt: { lt: sixMonthsAgo } },
      })
    }

    return tx.material.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.unit !== undefined && { unit: input.unit }),
        ...(input.unitCost !== undefined && {
          unitCost: new Prisma.Decimal(input.unitCost),
          lastPricedAt: priceChanged ? new Date() : existing.lastPricedAt,
        }),
        ...(input.supplier !== undefined && { supplier: input.supplier }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...('costCodeId' in input && { costCodeId: input.costCodeId }),
      },
      include: MATERIAL_INCLUDE,
    })
  })

  return material
}

export async function deleteMaterial(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getMaterial(fastify, id, organizationId)
  await fastify.prisma.material.delete({ where: { id } })
}

export async function getMaterialPriceHistory(
  fastify: FastifyInstance,
  materialId: string,
  organizationId: string
) {
  await getMaterial(fastify, materialId, organizationId)
  return fastify.prisma.materialPriceHistory.findMany({
    where: { materialId },
    include: HISTORY_INCLUDE,
    orderBy: { recordedAt: 'desc' },
  })
}
