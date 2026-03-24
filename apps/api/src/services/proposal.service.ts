import { Prisma } from '@prisma/client'

import { NotFoundError } from '../lib/errors'

import type {
  CreateProposalInput,
  CreateProposalTemplateInput,
  ProposalStatus,
  UpdateProposalInput,
  UpdateProposalTemplateInput,
  UpsertProposalLineItemsInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'


const PROPOSAL_SELECT = {
  id: true,
  proposalNumber: true,
  title: true,
  status: true,
  coverLetter: true,
  terms: true,
  validUntil: true,
  submittedAt: true,
  estimateId: true,
  organizationId: true,
  projectId: true,
  customerId: true,
  templateId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true, number: true } },
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      email: true,
      phone: true,
    },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  template: { select: { id: true, name: true } },
  lineItems: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      totalPrice: true,
      sortOrder: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} as const

// ===========================================
// PROPOSALS
// ===========================================

export async function listProposals(
  fastify: FastifyInstance,
  organizationId: string,
  query: {
    page?: string
    perPage?: string
    status?: ProposalStatus
    projectId?: string
    customerId?: string
  }
) {
  const where: Prisma.ProposalWhereInput = { organizationId }
  if (query.status) where.status = query.status
  if (query.projectId) where.projectId = query.projectId
  if (query.customerId) where.customerId = query.customerId

  return fastify.prisma.proposal.findMany({
    where,
    select: PROPOSAL_SELECT,
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  })
}

export async function getProposal(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const proposal = await fastify.prisma.proposal.findFirst({
    where: { id, organizationId },
    select: PROPOSAL_SELECT,
  })
  if (!proposal) throw new NotFoundError('Proposal not found')
  return proposal
}

export async function createProposal(
  fastify: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateProposalInput
) {
  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) throw new NotFoundError('Project not found')
  }

  if (input.customerId) {
    const contact = await fastify.prisma.contact.findFirst({
      where: { id: input.customerId, organizationId },
    })
    if (!contact) throw new NotFoundError('Customer (contact) not found')
  }

  let coverLetter = input.coverLetter
  let terms = input.terms

  if (input.templateId) {
    const template = await fastify.prisma.proposalTemplate.findFirst({
      where: { id: input.templateId, organizationId },
    })
    if (!template) throw new NotFoundError('Proposal template not found')
    if (!coverLetter && template.coverLetter) coverLetter = template.coverLetter
    if (!terms && template.terms) terms = template.terms
  }

  const count = await fastify.prisma.proposal.count({ where: { organizationId } })
  const proposalNumber = count + 1

  const lineItems = (input.lineItems ?? []).map((item, idx) => ({
    description: item.description,
    quantity: new Prisma.Decimal(item.quantity),
    unit: item.unit ?? null,
    unitPrice: new Prisma.Decimal(item.unitPrice),
    totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
    sortOrder: item.sortOrder ?? idx,
    notes: item.notes ?? null,
  }))

  return fastify.prisma.proposal.create({
    data: {
      proposalNumber,
      title: input.title,
      coverLetter: coverLetter ?? null,
      terms: terms ?? null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      organizationId,
      projectId: input.projectId ?? null,
      customerId: input.customerId ?? null,
      templateId: input.templateId ?? null,
      createdById,
      lineItems: { createMany: { data: lineItems } },
    },
    select: PROPOSAL_SELECT,
  })
}

export async function updateProposal(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateProposalInput
) {
  await getProposal(fastify, id, organizationId)

  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) throw new NotFoundError('Project not found')
  }

  if (input.customerId) {
    const contact = await fastify.prisma.contact.findFirst({
      where: { id: input.customerId, organizationId },
    })
    if (!contact) throw new NotFoundError('Customer (contact) not found')
  }

  const submittedAt =
    input.status === 'SENT' && !input.submittedAt
      ? new Date()
      : input.submittedAt
        ? new Date(input.submittedAt)
        : undefined

  return fastify.prisma.proposal.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.status !== undefined && { status: input.status }),
      ...('projectId' in input && { projectId: input.projectId }),
      ...('customerId' in input && { customerId: input.customerId }),
      ...('coverLetter' in input && { coverLetter: input.coverLetter }),
      ...('terms' in input && { terms: input.terms }),
      ...('validUntil' in input && {
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      }),
      ...(submittedAt !== undefined && { submittedAt }),
    },
    select: PROPOSAL_SELECT,
  })
}

export async function deleteProposal(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getProposal(fastify, id, organizationId)
  await fastify.prisma.proposal.delete({ where: { id } })
}

export async function upsertLineItems(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpsertProposalLineItemsInput
) {
  await getProposal(fastify, id, organizationId)
  await fastify.prisma.$transaction([
    fastify.prisma.proposalLineItem.deleteMany({ where: { proposalId: id } }),
    fastify.prisma.proposalLineItem.createMany({
      data: input.lineItems.map((item, idx) => ({
        proposalId: id,
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        unit: item.unit ?? null,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
        sortOrder: item.sortOrder ?? idx,
        notes: item.notes ?? null,
      })),
    }),
  ])
  return getProposal(fastify, id, organizationId)
}

// ===========================================
// PROPOSAL TEMPLATES
// ===========================================

export async function listProposalTemplates(
  fastify: FastifyInstance,
  organizationId: string,
  activeOnly = false
) {
  return fastify.prisma.proposalTemplate.findMany({
    where: { organizationId, ...(activeOnly ? { isActive: true } : {}) },
    orderBy: { name: 'asc' },
  })
}

export async function getProposalTemplate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  const template = await fastify.prisma.proposalTemplate.findFirst({
    where: { id, organizationId },
  })
  if (!template) throw new NotFoundError('Proposal template not found')
  return template
}

export async function createProposalTemplate(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateProposalTemplateInput
) {
  return fastify.prisma.proposalTemplate.create({ data: { ...input, organizationId } })
}

export async function updateProposalTemplate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string,
  input: UpdateProposalTemplateInput
) {
  await getProposalTemplate(fastify, id, organizationId)
  return fastify.prisma.proposalTemplate.update({ where: { id }, data: input })
}

export async function deleteProposalTemplate(
  fastify: FastifyInstance,
  id: string,
  organizationId: string
) {
  await getProposalTemplate(fastify, id, organizationId)
  await fastify.prisma.proposalTemplate.delete({ where: { id } })
}
