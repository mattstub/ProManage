import { describe, it, expect, vi, beforeEach } from 'vitest'

import { buildTaskTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

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

describe('GET /api/v1/tasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with list of tasks when authenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Install HVAC units')
    expect(body.meta.total).toBe(1)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 with invalid token', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { authorization: 'Bearer invalid.token.here' },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('filters tasks by status query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?status=OPEN',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN' }),
      })
    )

    await app.close()
  })

  it('filters tasks by projectId query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findMany.mockResolvedValue([baseTask])
    prisma.task.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks?projectId=project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'project-1' }),
      })
    )

    await app.close()
  })

  it('returns empty array when no tasks exist', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findMany.mockResolvedValue([])
    prisma.task.count.mockResolvedValue(0)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(0)
    expect(body.meta.total).toBe(0)

    await app.close()
  })
})

describe('GET /api/v1/tasks/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with task when found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(baseTask)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.id).toBe('task-1')
    expect(body.data.title).toBe('Install HVAC units')

    await app.close()
  })

  it('returns 404 when task not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/nonexistent',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/task-1',
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('only returns tasks from the same organization', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    // Task belongs to org-1, but user is from org-2
    prisma.task.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-2',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1', organizationId: 'org-2' },
      })
    )

    await app.close()
  })
})

describe('POST /api/v1/tasks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 on successful task creation with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])
    prisma.task.create.mockResolvedValue(baseTask)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Install HVAC units',
        description: 'Install 3 HVAC units on the second floor',
        priority: 'HIGH',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.title).toBe('Install HVAC units')

    await app.close()
  })

  it('returns 201 on successful task creation with ProjectManager role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'ProjectManager' } },
    ])
    prisma.task.create.mockResolvedValue(baseTask)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'pm@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'New task',
      },
    })

    expect(res.statusCode).toBe(201)

    await app.close()
  })

  it('returns 201 on successful task creation with OfficeAdmin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'OfficeAdmin' } },
    ])
    prisma.task.create.mockResolvedValue(baseTask)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'office@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Office task',
      },
    })

    expect(res.statusCode).toBe(201)

    await app.close()
  })

  it('returns 403 for FieldUser role (insufficient permissions)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'New task',
      },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 400 for validation error (missing title)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        description: 'Task without title',
      },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 400 for validation error (empty title)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: '',
      },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 400 for validation error (invalid priority)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Valid title',
        priority: 'INVALID_PRIORITY',
      },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      payload: {
        title: 'New task',
      },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

describe('PATCH /api/v1/tasks/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on successful update with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.task.update.mockResolvedValue({ ...baseTask, title: 'Updated title' })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'admin-user',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Updated title',
      },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.title).toBe('Updated title')

    await app.close()
  })

  it('returns 200 when assignee updates their own task', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.task.update.mockResolvedValue({ ...baseTask, status: 'COMPLETED' })
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser' } },
    ])

    // user-2 is the assignee of baseTask
    const token = signTestToken(app, {
      sub: 'user-2',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        status: 'COMPLETED',
      },
    })

    expect(res.statusCode).toBe(200)

    await app.close()
  })

  it('returns 403 when non-assignee FieldUser tries to update', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser' } },
    ])

    // user-3 is NOT the assignee of baseTask (assigneeId is user-2)
    const token = signTestToken(app, {
      sub: 'user-3',
      email: 'other@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        status: 'COMPLETED',
      },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 404 when task not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.task.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/nonexistent',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Updated',
      },
    })

    expect(res.statusCode).toBe(404)

    await app.close()
  })

  it('returns 400 for validation error (empty title)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: '',
      },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 400 for validation error (invalid status)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        status: 'INVALID_STATUS',
      },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/task-1',
      payload: {
        title: 'Updated',
      },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

describe('DELETE /api/v1/tasks/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful deletion with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])
    prisma.task.findFirst.mockResolvedValue(baseTask)
    prisma.task.delete.mockResolvedValue(baseTask)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)

    await app.close()
  })

  it('returns 403 for ProjectManager role (Admin only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'ProjectManager' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'pm@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 403 for FieldUser role (Admin only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'FieldUser' } },
    ])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)

    await app.close()
  })

  it('returns 404 when task not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildTaskTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([
      { role: { name: 'Admin' } },
    ])
    prisma.task.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/nonexistent',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildTaskTestApp()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/tasks/task-1',
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})
