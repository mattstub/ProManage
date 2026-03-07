import { describe, it, expect } from 'vitest'

import { createTaskSchema, updateTaskSchema } from '../../schemas/task'

describe('createTaskSchema', () => {
  const validTask = {
    title: 'Install HVAC units',
    description: 'Install 3 HVAC units on the second floor',
    priority: 'HIGH' as const,
    projectId: 'clh1234567890abcdefghijkl',
    assigneeId: 'clh1234567890abcdefghijkm',
    dueDate: '2024-06-15',
  }

  it('accepts valid task data with all fields', () => {
    const result = createTaskSchema.safeParse(validTask)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Install HVAC units')
      expect(result.data.priority).toBe('HIGH')
    }
  })

  it('accepts valid task with only required fields', () => {
    const result = createTaskSchema.safeParse({
      title: 'Simple task',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM')
    }
  })

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({
      projectId: 'clh1234567890abcdefghijkl',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({
      title: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title is required')
    }
  })

  it('rejects title over 200 characters', () => {
    const result = createTaskSchema.safeParse({
      title: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Task title must be 200 characters or less')
    }
  })

  it('accepts task without projectId (optional field)', () => {
    const result = createTaskSchema.safeParse({
      title: 'Valid title',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid projectId format when provided', () => {
    const result = createTaskSchema.safeParse({
      title: 'Valid title',
      projectId: 'not-a-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority value', () => {
    const result = createTaskSchema.safeParse({
      title: 'Valid title',
      priority: 'CRITICAL', // not in enum
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid priority values', () => {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
    for (const priority of priorities) {
      const result = createTaskSchema.safeParse({
        title: 'Task',
        priority,
      })
      expect(result.success).toBe(true)
    }
  })

  it('coerces string date to Date object', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      dueDate: '2024-06-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dueDate).toBeInstanceOf(Date)
    }
  })

  it('rejects invalid date string', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      dueDate: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })

  it('rejects description over 2000 characters', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      description: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts description at exactly 2000 characters', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      description: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid assigneeId format when provided', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      assigneeId: 'invalid-id',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid CUID for assigneeId', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
      assigneeId: 'clh1234567890abcdefghijkl',
    })
    expect(result.success).toBe(true)
  })

  it('defaults priority to MEDIUM when not provided', () => {
    const result = createTaskSchema.safeParse({
      title: 'Task',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('MEDIUM')
    }
  })
})

describe('updateTaskSchema', () => {
  it('accepts partial update with only title', () => {
    const result = updateTaskSchema.safeParse({
      title: 'Updated title',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated title')
    }
  })

  it('accepts partial update with only status', () => {
    const result = updateTaskSchema.safeParse({
      status: 'COMPLETED',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no fields to update)', () => {
    const result = updateTaskSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts null for nullable fields (clearing values)', () => {
    const result = updateTaskSchema.safeParse({
      description: null,
      assigneeId: null,
      dueDate: null,
      projectId: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
      expect(result.data.assigneeId).toBeNull()
      expect(result.data.dueDate).toBeNull()
      expect(result.data.projectId).toBeNull()
    }
  })

  it('rejects empty title', () => {
    const result = updateTaskSchema.safeParse({
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title over 200 characters', () => {
    const result = updateTaskSchema.safeParse({
      title: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status value', () => {
    const result = updateTaskSchema.safeParse({
      status: 'DELETED', // not in enum
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority value', () => {
    const result = updateTaskSchema.safeParse({
      priority: 'SUPER_HIGH', // not in enum
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid status values', () => {
    const statuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
    for (const status of statuses) {
      const result = updateTaskSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid priority values', () => {
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
    for (const priority of priorities) {
      const result = updateTaskSchema.safeParse({ priority })
      expect(result.success).toBe(true)
    }
  })

  it('coerces string date to Date object', () => {
    const result = updateTaskSchema.safeParse({
      dueDate: '2024-12-31',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dueDate).toBeInstanceOf(Date)
    }
  })

  it('rejects description over 2000 characters', () => {
    const result = updateTaskSchema.safeParse({
      description: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid assigneeId format', () => {
    const result = updateTaskSchema.safeParse({
      assigneeId: 'not-a-valid-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid projectId format', () => {
    const result = updateTaskSchema.safeParse({
      projectId: 'not-a-valid-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts multiple fields at once', () => {
    const result = updateTaskSchema.safeParse({
      title: 'New title',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      description: 'Updated description',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('New title')
      expect(result.data.status).toBe('IN_PROGRESS')
      expect(result.data.priority).toBe('URGENT')
      expect(result.data.description).toBe('Updated description')
    }
  })
})
