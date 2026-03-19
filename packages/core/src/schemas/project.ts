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

const projectScopeStatuses = ['Active', 'Completed', 'OnHold', 'Cancelled'] as const

const projectSettingsDefaultViews = ['dashboard', 'documents', 'safety', 'team'] as const

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
  ownerName: z.string().max(200).optional(),
  ownerPhone: z.string().max(50).optional(),
  ownerEmail: z.string().email().max(200).optional(),
  architectName: z.string().max(200).optional(),
  contractorLicense: z.string().max(100).optional(),
  permitNumber: z.string().max(100).optional(),
  budget: z.number().positive().optional(),
  squareFootage: z.number().int().positive().optional(),
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
  ownerName: z.string().max(200).nullish(),
  ownerPhone: z.string().max(50).nullish(),
  ownerEmail: z.string().email().max(200).nullish(),
  architectName: z.string().max(200).nullish(),
  contractorLicense: z.string().max(100).nullish(),
  permitNumber: z.string().max(100).nullish(),
  budget: z.number().positive().nullish(),
  squareFootage: z.number().int().positive().nullish(),
})

export const createProjectScopeSchema = z.object({
  name: z.string().min(1, 'Scope name is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(projectScopeStatuses).default('Active'),
  sequence: z.number().int().min(0).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.number().positive().optional(),
})

export const updateProjectScopeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  status: z.enum(projectScopeStatuses).optional(),
  sequence: z.number().int().min(0).optional(),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  budget: z.number().positive().nullish(),
})

export const updateProjectSettingsSchema = z.object({
  requireDailyReports: z.boolean().optional(),
  requireTimeTracking: z.boolean().optional(),
  enableSafetyModule: z.boolean().optional(),
  enableDocumentsModule: z.boolean().optional(),
  defaultView: z.enum(projectSettingsDefaultViews).optional(),
  notifyOnIncident: z.boolean().optional(),
  notifyOnDailyReport: z.boolean().optional(),
})

export const assignContactToProjectSchema = z.object({
  role: z.string().max(100).nullish(),
})

export type CreateProjectSchemaInput = z.infer<typeof createProjectSchema>
export type UpdateProjectSchemaInput = z.infer<typeof updateProjectSchema>
export type CreateProjectScopeSchemaInput = z.infer<typeof createProjectScopeSchema>
export type UpdateProjectScopeSchemaInput = z.infer<typeof updateProjectScopeSchema>
export type UpdateProjectSettingsSchemaInput = z.infer<typeof updateProjectSettingsSchema>
export type AssignContactToProjectSchemaInput = z.infer<typeof assignContactToProjectSchema>
