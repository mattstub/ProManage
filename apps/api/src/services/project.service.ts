import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { ConflictError, NotFoundError } from '../lib/errors'

import type {
  AssignContactToProjectSchemaInput,
  CreateProjectSchemaInput,
  CreateProjectScopeSchemaInput,
  ProjectStatus,
  ProjectType,
  UpdateProjectSchemaInput,
  UpdateProjectScopeSchemaInput,
  UpdateProjectSettingsSchemaInput,
} from '@promanage/core'
import type { FastifyInstance } from 'fastify'

// Lean select for list endpoint — no relations for performance
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
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  architectName: true,
  contractorLicense: true,
  permitNumber: true,
  budget: true,
  squareFootage: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
}

// Full select with relations for detail/create/update responses
const PROJECT_WITH_RELATIONS_SELECT = {
  ...PROJECT_SELECT,
  scopes: {
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      sequence: true,
      startDate: true,
      endDate: true,
      budget: true,
      projectId: true,
      organizationId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sequence: 'asc' as const },
  },
  settings: {
    select: {
      id: true,
      projectId: true,
      requireDailyReports: true,
      requireTimeTracking: true,
      enableSafetyModule: true,
      enableDocumentsModule: true,
      defaultView: true,
      notifyOnIncident: true,
      notifyOnDailyReport: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  contactProjects: {
    select: {
      assignedAt: true,
      role: true,
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          type: true,
          email: true,
          phone: true,
          mobile: true,
          title: true,
        },
      },
    },
  },
  _count: {
    select: {
      tasks: true,
      incidentReports: true,
      toolboxTalks: true,
      channels: true,
    },
  },
}

export async function listProjects(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: string; perPage?: string; status?: ProjectStatus; type?: ProjectType; search?: string }
) {
  const { page, perPage, skip, take } = parsePagination(query)
  const where = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { number: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
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
    select: PROJECT_WITH_RELATIONS_SELECT,
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

  // Create project + settings atomically
  const project = await fastify.prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: { ...input, organizationId },
    })
    await tx.projectSettings.create({
      data: { projectId: created.id },
    })
    return created
  })

  return getProject(fastify, project.id, organizationId)
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

  await fastify.prisma.project.update({
    where: { id: projectId },
    data: input,
  })

  return getProject(fastify, projectId, organizationId)
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

export async function getProjectDashboard(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  const project = await getProject(fastify, projectId, organizationId)

  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    openTaskCount,
    overdueTaskCount,
    openIncidentCount,
    upcomingEventsCount,
    scheduledToolboxTalksCount,
  ] = await Promise.all([
    fastify.prisma.task.count({
      where: { projectId, status: { notIn: ['DONE', 'CANCELLED'] } },
    }),
    fastify.prisma.task.count({
      where: {
        projectId,
        dueDate: { lt: now },
        status: { notIn: ['DONE', 'CANCELLED'] },
      },
    }),
    fastify.prisma.incidentReport.count({
      where: { projectId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    }),
    fastify.prisma.calendarEvent.count({
      where: {
        projectId,
        startDate: { gte: now, lte: sevenDaysFromNow },
      },
    }),
    fastify.prisma.toolboxTalk.count({
      where: { projectId, status: 'SCHEDULED' },
    }),
  ])

  const metrics = {
    openTaskCount,
    overdueTaskCount,
    openIncidentCount,
    upcomingEventsCount,
    scheduledToolboxTalksCount,
    activeContactCount: project.contactProjects.length,
    scopeProgress: project.scopes.map((s) => ({
      scopeId: s.id,
      scopeName: s.name,
      status: s.status as 'Active' | 'Completed' | 'OnHold' | 'Cancelled',
    })),
  }

  return { project, metrics }
}

export async function listProjectContacts(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await getProject(fastify, projectId, organizationId)

  return fastify.prisma.contactProject.findMany({
    where: { projectId },
    select: {
      assignedAt: true,
      role: true,
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          type: true,
          email: true,
          phone: true,
          mobile: true,
          title: true,
        },
      },
    },
  })
}

export async function assignContactToProject(
  fastify: FastifyInstance,
  projectId: string,
  contactId: string,
  organizationId: string,
  input: AssignContactToProjectSchemaInput
) {
  // Verify project belongs to org
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  // Verify contact belongs to org
  const contact = await fastify.prisma.contact.findFirst({
    where: { id: contactId, organizationId },
    select: { id: true },
  })
  if (!contact) throw new NotFoundError('Contact not found')

  await fastify.prisma.contactProject.upsert({
    where: { contactId_projectId: { contactId, projectId } },
    create: { contactId, projectId, role: input.role ?? null },
    update: { role: input.role ?? null },
  })
}

export async function removeContactFromProject(
  fastify: FastifyInstance,
  projectId: string,
  contactId: string,
  organizationId: string
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  const contact = await fastify.prisma.contact.findFirst({
    where: { id: contactId, organizationId },
    select: { id: true },
  })
  if (!contact) throw new NotFoundError('Contact not found')

  await fastify.prisma.contactProject.delete({
    where: { contactId_projectId: { contactId, projectId } },
  })
}

export async function listProjectScopes(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  await getProject(fastify, projectId, organizationId)

  return fastify.prisma.projectScope.findMany({
    where: { projectId, organizationId },
    orderBy: { sequence: 'asc' },
  })
}

export async function createProjectScope(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: CreateProjectScopeSchemaInput
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  return fastify.prisma.projectScope.create({
    data: { ...input, projectId, organizationId },
  })
}

export async function updateProjectScope(
  fastify: FastifyInstance,
  scopeId: string,
  projectId: string,
  organizationId: string,
  input: UpdateProjectScopeSchemaInput
) {
  const scope = await fastify.prisma.projectScope.findFirst({
    where: { id: scopeId, projectId, organizationId },
  })
  if (!scope) throw new NotFoundError('Project scope not found')

  return fastify.prisma.projectScope.update({
    where: { id: scopeId },
    data: input,
  })
}

export async function deleteProjectScope(
  fastify: FastifyInstance,
  scopeId: string,
  projectId: string,
  organizationId: string
) {
  const scope = await fastify.prisma.projectScope.findFirst({
    where: { id: scopeId, projectId, organizationId },
  })
  if (!scope) throw new NotFoundError('Project scope not found')

  await fastify.prisma.projectScope.delete({ where: { id: scopeId } })
}

export async function getProjectSettings(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  return fastify.prisma.projectSettings.upsert({
    where: { projectId },
    create: { projectId },
    update: {},
  })
}

export async function updateProjectSettings(
  fastify: FastifyInstance,
  projectId: string,
  organizationId: string,
  input: UpdateProjectSettingsSchemaInput
) {
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true },
  })
  if (!project) throw new NotFoundError('Project not found')

  return fastify.prisma.projectSettings.upsert({
    where: { projectId },
    create: { projectId, ...input },
    update: input,
  })
}
