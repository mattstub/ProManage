import { z } from 'zod'

const projectTypes = [
  'Commercial',
  'Residential',
  'Industrial',
  'Municipal',
  'Institutional',
] as const

const projectStatuses = [
  'Bidding',
  'PreConstruction',
  'Active',
  'OnHold',
  'Completed',
  'Closed',
] as const

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less'),
  number: z
    .string()
    .min(1, 'Project number is required')
    .max(50, 'Project number must be 50 characters or less'),
  type: z.enum(projectTypes).default('Commercial'),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  number: z.string().min(1).max(50).optional(),
  type: z.enum(projectTypes).optional(),
  status: z.enum(projectStatuses).optional(),
  description: z.string().max(2000).nullish(),
  address: z.string().max(500).nullish(),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
})

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>
export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>
