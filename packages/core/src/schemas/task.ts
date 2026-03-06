import { z } from 'zod'

const taskStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be 200 characters or less'),
  description: z.string().max(2000).optional(),
  priority: z.enum(taskPriorities).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  projectId: z.string().cuid().optional(),
  assigneeId: z.string().cuid().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  dueDate: z.coerce.date().nullish(),
  projectId: z.string().cuid().nullish(),
  assigneeId: z.string().cuid().nullish(),
})

export type CreateTaskSchemaInput = z.infer<typeof createTaskSchema>
export type UpdateTaskSchemaInput = z.infer<typeof updateTaskSchema>
