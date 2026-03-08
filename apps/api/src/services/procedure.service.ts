import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { NotFoundError } from '../lib/errors'

import type { CreateProcedureSchemaInput, ProcedureStatus, UpdateProcedureSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const PROCEDURE_SELECT = {
  id: true,
  title: true,
  content: true,
  category: true,
  status: true,
  organizationId: true,
  projectId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      number: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
}

export interface ListProceduresQuery {
  page?: string
  perPage?: string
  status?: ProcedureStatus
  category?: string
  projectId?: string
}

export async function listProcedures(
  fastify: FastifyInstance,
  organizationId: string,
  query: ListProceduresQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)
  const where = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  }

  const [procedures, total] = await Promise.all([
    fastify.prisma.procedure.findMany({
      where,
      select: PROCEDURE_SELECT,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      skip,
      take,
    }),
    fastify.prisma.procedure.count({ where }),
  ])

  return { procedures, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getProcedure(
  fastify: FastifyInstance,
  procedureId: string,
  organizationId: string
) {
  const procedure = await fastify.prisma.procedure.findFirst({
    where: { id: procedureId, organizationId },
    select: PROCEDURE_SELECT,
  })

  if (!procedure) {
    throw new NotFoundError('Procedure not found')
  }

  return procedure
}

export async function createProcedure(
  fastify: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateProcedureSchemaInput
) {
  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  const procedure = await fastify.prisma.procedure.create({
    data: {
      ...input,
      status: 'DRAFT',
      organizationId,
      createdById,
    },
    select: PROCEDURE_SELECT,
  })

  return procedure
}

export async function updateProcedure(
  fastify: FastifyInstance,
  procedureId: string,
  organizationId: string,
  input: UpdateProcedureSchemaInput
) {
  await getProcedure(fastify, procedureId, organizationId)

  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  const updated = await fastify.prisma.procedure.update({
    where: { id: procedureId },
    data: input,
    select: PROCEDURE_SELECT,
  })

  return updated
}

export async function deleteProcedure(
  fastify: FastifyInstance,
  procedureId: string,
  organizationId: string
) {
  await getProcedure(fastify, procedureId, organizationId)

  await fastify.prisma.procedure.delete({
    where: { id: procedureId },
  })
}
