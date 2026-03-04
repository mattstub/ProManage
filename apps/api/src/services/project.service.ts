import { ConflictError, NotFoundError } from '../lib/errors'
import { buildPaginationMeta, parsePagination } from '@promanage/core'

import type { CreateProjectSchemaInput, ProjectStatus, UpdateProjectSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const PROJECT_SELECT = {
  id: true,
  name: true,
  number: true,
  type: true,
  status: true,
  description: true,
  address: true,
  startDate: true,
  endDate: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
}

export async function listProjects(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: string; perPage?: string; status?: ProjectStatus }
) {
  const { page, perPage, skip, take } = parsePagination(query)
  const where = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
  }

  const [projects, total] = await Promise.all([
    fastify.prisma.project.findMany({
      where,
      select: PROJECT_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    fastify.prisma.project.count({ where }),
  ])

  return { projects, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getProject(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: PROJECT_SELECT,
  })

  if (!project) {
    throw new NotFoundError('Project not found')
  }

  return project
}

export async function createProject(
  fastify: FastifyInstance,
  organizationId: string,
  input: CreateProjectSchemaInput
) {
  const existing = await fastify.prisma.project.findUnique({
    where: { number_organizationId: { number: input.number, organizationId } },
  })

  if (existing) {
    throw new ConflictError('A project with this number already exists')
  }

  const project = await fastify.prisma.project.create({
    data: { ...input, organizationId },
    select: PROJECT_SELECT,
  })

  return project
}

export async function updateProject(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: UpdateProjectSchemaInput
) {
  await getProject(fastify, projectId, organizationId)

  if (input.number) {
    const duplicate = await fastify.prisma.project.findFirst({
      where: {
        number: input.number,
        organizationId,
        NOT: { id: projectId },
      },
    })
    if (duplicate) {
      throw new ConflictError('A project with this number already exists')
    }
  }

  const project = await fastify.prisma.project.update({
    where: { id: projectId },
    data: input,
    select: PROJECT_SELECT,
  })

  return project
}

export async function archiveProject(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await getProject(fastify, projectId, organizationId)

  await fastify.prisma.project.update({
    where: { id: projectId },
    data: { status: 'Closed' },
  })
}
