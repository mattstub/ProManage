import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { FastifyInstance } from 'fastify'

import { ForbiddenError, NotFoundError } from '../../lib/errors'
import * as taskService from '../../services/task.service'
import { createMockPrisma } from '../helpers/mock-prisma'

function buildMockFastify() {
  const prisma = createMockPrisma()
  return {
    fastify: { prisma } as unknown as FastifyInstance,
    prisma,
  }
}

const baseTask = {
  id: 'task-1',
  title: 'Install HVAC units',
  description: 'Install 3 HVAC units on the second floor',
  status: 'OPEN',
  priority: 'HIGH',
  dueDate: new Date('2024-06-15'),
  organizationId: 'org-1',
  projectId: 'project-1',
  assigneeId: 'user-2',
  creatorId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  project: {
    id: 'project-1',
    name: 'Office Building',
    number: 'PRJ-001',
  },
  assignee: {
    id: 'user-2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  creator: {
    id: 'user-1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
}

describe('taskService.listTasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated tasks filtered by organizationId', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    const result = await taskService.listTasks(fastify, 'org-1', {})

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Install HVAC units')
    expect(result.meta.total).toBe(1)
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
      })
    )
  })

  it('filters tasks by status when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    await taskService.listTasks(fastify, 'org-1', { status: 'OPEN' })

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', status: 'OPEN' },
      })
    )
  })

  it('filters tasks by projectId when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    await taskService.listTasks(fastify, 'org-1', { projectId: 'project-1' })

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', projectId: 'project-1' },
      })
    )
  })

  it('filters tasks by assigneeId when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    await taskService.listTasks(fastify, 'org-1', { assigneeId: 'user-2' })

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', assigneeId: 'user-2' },
      })
    )
  })

  it('returns empty array when no tasks exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([])
    prisma.task.count.mockResolvedValue(0)

    const result = await taskService.listTasks(fastify, 'org-1', {})

    expect(result.tasks).toHaveLength(0)
    expect(result.meta.total).toBe(0)
  })

  it('respects pagination parameters', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(50)

    const result = await taskService.listTasks(fastify, 'org-1', {
      page: '2',
      perPage: '10',
    })

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
    expect(result.meta.page).toBe(2)
    expect(result.meta.perPage).toBe(10)
  })
})

describe('taskService.getTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns task if it exists in the same organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)

    const result = await taskService.getTask(fastify, 'task-1', 'org-1')

    expect(result.id).toBe('task-1')
    expect(result.title).toBe('Install HVAC units')
    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1', organizationId: 'org-1' },
      })
    )
  })

  it('throws NotFoundError if task does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      taskService.getTask(fastify, 'nonexistent-task', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError if task is in different organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      taskService.getTask(fastify, 'task-1', 'org-2')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('taskService.createTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates task with correct fields and creatorId', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.create.mockResolvedValue(baseTask)

    const input = {
      title: 'Install HVAC units',
      description: 'Install 3 HVAC units on the second floor',
      priority: 'HIGH' as const,
    }

    const result = await taskService.createTask(fastify, 'org-1', 'user-1', input)

    expect(result.title).toBe('Install HVAC units')
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Install HVAC units',
          description: 'Install 3 HVAC units on the second floor',
          priority: 'HIGH',
          status: 'OPEN',
          organizationId: 'org-1',
          creatorId: 'user-1',
        }),
      })
    )
  })

  it('validates projectId belongs to organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    const input = {
      title: 'Task with invalid project',
      projectId: 'invalid-project',
    }

    await expect(
      taskService.createTask(fastify, 'org-1', 'user-1', input)
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('validates assigneeId belongs to organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findFirst.mockResolvedValue(null)

    const input = {
      title: 'Task with invalid assignee',
      assigneeId: 'invalid-user',
    }

    await expect(
      taskService.createTask(fastify, 'org-1', 'user-1', input)
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('creates task with projectId when project exists', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.task.create.mockResolvedValue(baseTask)

    const input = {
      title: 'Task with project',
      projectId: 'project-1',
    }

    await taskService.createTask(fastify, 'org-1', 'user-1', input)

    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'project-1', organizationId: 'org-1' },
    })
    expect(prisma.task.create).toHaveBeenCalled()
  })

  it('creates task with assigneeId when assignee exists', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findFirst.mockResolvedValue({ id: 'user-2', isActive: true })
    prisma.task.create.mockResolvedValue(baseTask)

    const input = {
      title: 'Task with assignee',
      assigneeId: 'user-2',
    }

    await taskService.createTask(fastify, 'org-1', 'user-1', input)

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-2', organizationId: 'org-1', isActive: true },
    })
    expect(prisma.task.create).toHaveBeenCalled()
  })
})

describe('taskService.updateTask', () => {
  beforeEach(() => vi.clearAllMocks())

  const mockUserRole = (roleName: string) => [{ role: { name: roleName } }]

  it('updates task when user is Admin', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('Admin'))
    prisma.task.update.mockResolvedValue({ ...baseTask, title: 'Updated title' })

    const result = await taskService.updateTask(
      fastify,
      'task-1',
      'org-1',
      'admin-user',
      { title: 'Updated title' }
    )

    expect(result.title).toBe('Updated title')
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { title: 'Updated title' },
      })
    )
  })

  it('updates task when user is ProjectManager', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('ProjectManager'))
    prisma.task.update.mockResolvedValue({ ...baseTask, status: 'IN_PROGRESS' })

    const result = await taskService.updateTask(
      fastify,
      'task-1',
      'org-1',
      'pm-user',
      { status: 'IN_PROGRESS' }
    )

    expect(result.status).toBe('IN_PROGRESS')
  })

  it('updates task when user is OfficeAdmin', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('OfficeAdmin'))
    prisma.task.update.mockResolvedValue({ ...baseTask, priority: 'URGENT' })

    await taskService.updateTask(
      fastify,
      'task-1',
      'org-1',
      'office-admin',
      { priority: 'URGENT' }
    )

    expect(prisma.task.update).toHaveBeenCalled()
  })

  it('updates task when user is the assignee', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('FieldUser'))
    prisma.task.update.mockResolvedValue({ ...baseTask, status: 'COMPLETED' })

    const result = await taskService.updateTask(
      fastify,
      'task-1',
      'org-1',
      'user-2', // assigneeId matches
      { status: 'COMPLETED' }
    )

    expect(result.status).toBe('COMPLETED')
  })

  it('throws ForbiddenError when user has no permission', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('FieldUser'))

    await expect(
      taskService.updateTask(
        fastify,
        'task-1',
        'org-1',
        'random-user',
        { title: 'Unauthorized update' }
      )
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('throws NotFoundError when task does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      taskService.updateTask(
        fastify,
        'nonexistent',
        'org-1',
        'user-1',
        { title: 'Update' }
      )
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('validates projectId when updating', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('Admin'))
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      taskService.updateTask(
        fastify,
        'task-1',
        'org-1',
        'admin-user',
        { projectId: 'invalid-project' }
      )
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('validates assigneeId when updating', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue(mockUserRole('Admin'))
    prisma.user.findFirst.mockResolvedValue(null)

    await expect(
      taskService.updateTask(
        fastify,
        'task-1',
        'org-1',
        'admin-user',
        { assigneeId: 'invalid-user' }
      )
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('taskService.deleteTask', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes task when it exists', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.task.delete.mockResolvedValue(baseTask)

    await taskService.deleteTask(fastify, 'task-1', 'org-1')

    expect(prisma.task.delete).toHaveBeenCalledWith({
      where: { id: 'task-1' },
    })
  })

  it('throws NotFoundError when task does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      taskService.deleteTask(fastify, 'nonexistent', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError when task is in different organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.task.findFirst.mockResolvedValue(null)

    await expect(
      taskService.deleteTask(fastify, 'task-1', 'org-2')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
