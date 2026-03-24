import { Prisma } from '@prisma/client'

import { NotFoundError } from '../lib/errors'

import type {
  CreateBidResultInput,
  CreateEstimateInput,
  CreateEstimateItemInput,
  CreateEstimateItemVendorQuoteInput,
  UpdateBidResultInput,
  UpdateEstimateInput,
  UpdateEstimateItemInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'


const VENDOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  company: true,
} as const

const ITEM_INCLUDE = {
  vendorQuotes: {
    include: { vendor: { select: VENDOR_SELECT } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const

const ESTIMATE_INCLUDE = {
  items: {
    include: ITEM_INCLUDE,
    orderBy: { sortOrder: 'asc' as const },
  },
  bidResults: { orderBy: { submittedAt: 'asc' as const } },
} as const

// ===========================================
// INTERNAL HELPERS
// ===========================================

async function recomputeEstimateTotal(fastify: FastifyInstance, estimateId: string) {
  const agg = await fastify.prisma.estimateItem.aggregate({
    where: { estimateId },
    _sum: { totalCost: true },
  })
  await fastify.prisma.estimate.update({
    where: { id: estimateId },
    data: { totalCost: agg._sum.totalCost ?? new Prisma.Decimal(0) },
  })
}

// ===========================================
// ESTIMATES
// ===========================================

export async function listEstimates(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  return fastify.prisma.estimate.findMany({
    where: { projectId, organizationId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listAllEstimates(fastify: FastifyInstance, organizationId: string) {
  return fastify.prisma.estimate.findMany({
    where: { organizationId },
    include: { project: { select: { id: true, name: true, number: true } } },
    orderBy: [{ projectId: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getEstimate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const estimate = await fastify.prisma.estimate.findFirst({
    where: { id, organizationId },
    include: ESTIMATE_INCLUDE,
  })
  if (!estimate) throw new NotFoundError('Estimate not found')
  return estimate
}

export async function createEstimate(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  createdById: string,
  input: CreateEstimateInput
) {
  const project = await fastify.prisma.project.findFirst({ where: { id: projectId, organizationId } })
  if (!project) throw new NotFoundError('Project not found')

  return fastify.prisma.estimate.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'DRAFT',
      bidDueDate: input.bidDueDate ? new Date(input.bidDueDate) : null,
      organizationId,
      projectId,
      createdById,
    },
  })
}

export async function updateEstimate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateEstimateInput
) {
  await getEstimate(fastify, id, organizationId)
  return fastify.prisma.estimate.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status !== undefined && { status: input.status }),
      ...('bidDueDate' in input && {
        bidDueDate: input.bidDueDate ? new Date(input.bidDueDate) : null,
      }),
    },
  })
}

export async function deleteEstimate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getEstimate(fastify, id, organizationId)
  await fastify.prisma.estimate.delete({ where: { id } })
}

export async function getEstimateSummary(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getEstimate(fastify, id, organizationId)
  const [agg, vendorQuoteCount] = await Promise.all([
    fastify.prisma.estimateItem.aggregate({
      where: { estimateId: id },
      _sum: { totalCost: true },
      _count: { id: true },
    }),
    fastify.prisma.estimateItemVendorQuote.count({
      where: { estimateItem: { estimateId: id } },
    }),
  ])
  return {
    estimateId: id,
    totalCost: (agg._sum.totalCost ?? new Prisma.Decimal(0)).toString(),
    itemCount: agg._count.id,
    vendorQuoteCount,
  }
}

// ===========================================
// ESTIMATE ITEMS
// ===========================================

export async function listEstimateItems(
  fastify: FastifyInstance,
  estimateId: string,
  organizationId: string
) {
  await getEstimate(fastify, estimateId, organizationId)
  return fastify.prisma.estimateItem.findMany({
    where: { estimateId },
    include: ITEM_INCLUDE,
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createEstimateItem(
  fastify: FastifyInstance,
  estimateId: string,
  organizationId: string,
  input: CreateEstimateItemInput
) {
  await getEstimate(fastify, estimateId, organizationId)
  const qty = new Prisma.Decimal(input.quantity)
  const cost = new Prisma.Decimal(input.unitCost)
  const total = qty.times(cost)

  const item = await fastify.prisma.estimateItem.create({
    data: {
      description: input.description,
      quantity: qty,
      unit: input.unit ?? 'EA',
      unitCost: cost,
      totalCost: total,
      costCode: input.costCode ?? null,
      sortOrder: input.sortOrder ?? 0,
      notes: input.notes ?? null,
      estimateId,
      organizationId,
    },
  })

  await recomputeEstimateTotal(fastify, estimateId)
  return item
}

export async function updateEstimateItem(
  fastify: FastifyInstance,
  id: string,
  estimateId: string,
  organizationId: string,
  input: UpdateEstimateItemInput
) {
  const existing = await fastify.prisma.estimateItem.findFirst({
    where: { id, estimateId, organizationId },
  })
  if (!existing) throw new NotFoundError('Estimate item not found')

  const qty = new Prisma.Decimal(input.quantity ?? existing.quantity.toString())
  const cost = new Prisma.Decimal(input.unitCost ?? existing.unitCost.toString())
  const total = qty.times(cost)

  const item = await fastify.prisma.estimateItem.update({
    where: { id },
    data: {
      ...(input.description !== undefined && { description: input.description }),
      quantity: qty,
      ...(input.unit !== undefined && { unit: input.unit }),
      unitCost: cost,
      totalCost: total,
      ...('costCode' in input && { costCode: input.costCode }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...('notes' in input && { notes: input.notes }),
    },
  })

  await recomputeEstimateTotal(fastify, estimateId)
  return item
}

export async function deleteEstimateItem(
  fastify: FastifyInstance,
  id: string,
  estimateId: string,
  organizationId: string
) {
  const item = await fastify.prisma.estimateItem.findFirst({
    where: { id, estimateId, organizationId },
  })
  if (!item) throw new NotFoundError('Estimate item not found')
  await fastify.prisma.estimateItem.delete({ where: { id } })
  await recomputeEstimateTotal(fastify, estimateId)
}

// ===========================================
// VENDOR QUOTES
// ===========================================

export async function listVendorQuotes(
  fastify: FastifyInstance,
  estimateItemId: string,
  organizationId: string
) {
  const item = await fastify.prisma.estimateItem.findFirst({
    where: { id: estimateItemId, organizationId },
  })
  if (!item) throw new NotFoundError('Estimate item not found')
  return fastify.prisma.estimateItemVendorQuote.findMany({
    where: { estimateItemId },
    include: { vendor: { select: VENDOR_SELECT } },
    orderBy: { quotedAt: 'desc' },
  })
}

export async function upsertVendorQuote(
  fastify: FastifyInstance,
  estimateItemId: string,
  organizationId: string,
  input: CreateEstimateItemVendorQuoteInput
) {
  const item = await fastify.prisma.estimateItem.findFirst({
    where: { id: estimateItemId, organizationId },
  })
  if (!item) throw new NotFoundError('Estimate item not found')

  const vendor = await fastify.prisma.contact.findFirst({
    where: { id: input.vendorId, organizationId },
  })
  if (!vendor) throw new NotFoundError('Vendor (contact) not found')

  const unitPrice = new Prisma.Decimal(input.unitPrice)
  const totalPrice = item.quantity.times(unitPrice)

  return fastify.prisma.estimateItemVendorQuote.upsert({
    where: { estimateItemId_vendorId: { estimateItemId, vendorId: input.vendorId } },
    create: {
      estimateItemId,
      vendorId: input.vendorId,
      unitPrice,
      totalPrice,
      notes: input.notes ?? null,
      quotedAt: new Date(input.quotedAt),
      organizationId,
    },
    update: {
      unitPrice,
      totalPrice,
      notes: input.notes ?? null,
      quotedAt: new Date(input.quotedAt),
    },
    include: { vendor: { select: VENDOR_SELECT } },
  })
}

export async function deleteVendorQuote(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const quote = await fastify.prisma.estimateItemVendorQuote.findFirst({
    where: { id, organizationId },
  })
  if (!quote) throw new NotFoundError('Vendor quote not found')
  await fastify.prisma.estimateItemVendorQuote.delete({ where: { id } })
}

// ===========================================
// BID RESULTS
// ===========================================

export async function listBidResults(
  fastify: FastifyInstance,
  estimateId: string,
  organizationId: string
) {
  await getEstimate(fastify, estimateId, organizationId)
  return fastify.prisma.bidResult.findMany({
    where: { estimateId },
    orderBy: { submittedAt: 'asc' },
  })
}

export async function createBidResult(
  fastify: FastifyInstance,
  estimateId: string,
  organizationId: string,
  input: CreateBidResultInput
) {
  await getEstimate(fastify, estimateId, organizationId)
  return fastify.prisma.bidResult.create({
    data: {
      competitorName: input.competitorName,
      bidAmount: new Prisma.Decimal(input.bidAmount),
      notes: input.notes ?? null,
      isAwarded: input.isAwarded ?? false,
      submittedAt: new Date(input.submittedAt),
      estimateId,
      organizationId,
    },
  })
}

export async function updateBidResult(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateBidResultInput
) {
  const result = await fastify.prisma.bidResult.findFirst({ where: { id, organizationId } })
  if (!result) throw new NotFoundError('Bid result not found')
  return fastify.prisma.bidResult.update({
    where: { id },
    data: {
      ...(input.competitorName !== undefined && { competitorName: input.competitorName }),
      ...(input.bidAmount !== undefined && { bidAmount: new Prisma.Decimal(input.bidAmount) }),
      ...('notes' in input && { notes: input.notes }),
      ...(input.isAwarded !== undefined && { isAwarded: input.isAwarded }),
      ...(input.submittedAt !== undefined && { submittedAt: new Date(input.submittedAt) }),
    },
  })
}

export async function deleteBidResult(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const result = await fastify.prisma.bidResult.findFirst({ where: { id, organizationId } })
  if (!result) throw new NotFoundError('Bid result not found')
  await fastify.prisma.bidResult.delete({ where: { id } })
}
