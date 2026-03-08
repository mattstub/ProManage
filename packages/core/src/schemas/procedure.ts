import { z } from 'zod'

const procedureStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

export const createProcedureSchema = z.object({
  title: z
    .string()
    .min(1, 'Procedure title is required')
    .max(200, 'Procedure title must be 200 characters or less'),
  content: z.string().min(1, 'Content is required').max(50000),
  category: z.string().max(100).default('General'),
  projectId: z.string().cuid().optional(),
})

export const updateProcedureSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(procedureStatuses).optional(),
  projectId: z.string().cuid().nullish(),
})

export type CreateProcedureSchemaInput = z.infer<typeof createProcedureSchema>
export type UpdateProcedureSchemaInput = z.infer<typeof updateProcedureSchema>
