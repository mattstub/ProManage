import { buildPaginationMeta, parsePagination } from '@promanage/core'

import { ForbiddenError, NotFoundError } from '../lib/errors'

import { createNotification } from './notification.service'

import type { CreateTaskSchemaInput, TaskStatus, UpdateTaskSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  organizationId: true,
  projectId: true,
  assigneeId: true,
  creatorId: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      name: true,
      number: true,
    },
  },
  assignee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  creator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
}

export interface ListTasksQuery {
  page?: string
  perPage?: string
  status?: TaskStatus
  assigneeId?: string
  projectId?: string
}

export async function listTasks(
  fastify: FastifyInstance,
  organizationId: string,
  query: ListTasksQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)
  const where = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
  }

  const [tasks, total] = await Promise.all([
    fastify.prisma.task.findMany({
      where,
      select: TASK_SELECT,
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take,
    }),
    fastify.prisma.task.count({ where }),
  ])

  return { tasks, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getTask(
  fastify: FastifyInstance,
  taskId: string,
  organizationId: string
) {
  const task = await fastify.prisma.task.findFirst({
    where: { id: taskId, organizationId },
    select: TASK_SELECT,
  })

  if (!task) {
    throw new NotFoundError('Task not found')
  }

  return task
}

export async function createTask(
  fastify: FastifyInstance,
  organizationId: string,
  creatorId: string,
  input: CreateTaskSchemaInput
) {
  // Validate projectId belongs to the organization if provided
  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  // Validate assigneeId belongs to the organization if provided
  if (input.assigneeId) {
    const assignee = await fastify.prisma.user.findFirst({
      where: { id: input.assigneeId, organizationId, isActive: true },
    })
    if (!assignee) {
      throw new NotFoundError('Assignee not found')
    }
  }

  const task = await fastify.prisma.task.create({
    data: {
      ...input,
      status: 'OPEN',
      organizationId,
      creatorId,
    },
    select: TASK_SELECT,
  })

  // Notify the assignee (non-critical — never fails the task creation)
  if (task.assigneeId && task.assigneeId !== creatorId) {
    createNotification(fastify, {
      userId: task.assigneeId,
      organizationId,
      title: 'Task Assigned',
      message: `You have been assigned to "${task.title}"`,
      type: 'TASK_ASSIGNED',
      entityId: task.id,
      entityType: 'task',
    }).catch(() => {})
  }

  return task
}

export async function updateTask(
  fastify: FastifyInstance,
  taskId: string,
  organizationId: string,
  userId: string,
  input: UpdateTaskSchemaInput
) {
  const task = await getTask(fastify, taskId, organizationId)

  // Fetch user roles for permission check
  const userRoles = await fastify.prisma.userRole.findMany({
    where: {
      userId,
      role: { organizationId },
    },
    include: { role: true },
  })
  const roleNames = userRoles.map((ur) => ur.role.name)

  // Check permissions: Admin, ProjectManager, OfficeAdmin can update any task
  // Assignee can update their own tasks
  const canManage = roleNames.some((role) =>
    ['Admin', 'ProjectManager', 'OfficeAdmin'].includes(role)
  )
  const isAssignee = task.assigneeId === userId

  if (!canManage && !isAssignee) {
    throw new ForbiddenError('You do not have permission to update this task')
  }

  // Validate projectId belongs to the organization if being updated
  if (input.projectId) {
    const project = await fastify.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    })
    if (!project) {
      throw new NotFoundError('Project not found')
    }
  }

  // Validate assigneeId belongs to the organization if being updated
  if (input.assigneeId) {
    const assignee = await fastify.prisma.user.findFirst({
      where: { id: input.assigneeId, organizationId, isActive: true },
    })
    if (!assignee) {
      throw new NotFoundError('Assignee not found')
    }
  }

  const previousAssigneeId = task.assigneeId

  const updatedTask = await fastify.prisma.task.update({
    where: { id: taskId },
    data: input,
    select: TASK_SELECT,
  })

  // Notify new assignee when the assignee changes (non-critical)
  if (
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== previousAssigneeId &&
    updatedTask.assigneeId !== userId
  ) {
    createNotification(fastify, {
      userId: updatedTask.assigneeId,
      organizationId,
      title: 'Task Assigned',
      message: `You have been assigned to "${updatedTask.title}"`,
      type: 'TASK_ASSIGNED',
      entityId: updatedTask.id,
      entityType: 'task',
    }).catch(() => {})
  }

  return updatedTask
}

export async function deleteTask(
  fastify: FastifyInstance,
  taskId: string,
  organizationId: string
) {
  await getTask(fastify, taskId, organizationId)

  await fastify.prisma.task.delete({
    where: { id: taskId },
  })
}
