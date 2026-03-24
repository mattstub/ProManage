import { z } from 'zod'

const MATERIAL_UNITS = [
  'EA', 'LF', 'SF', 'SY', 'CY', 'LB', 'TON', 'GAL', 'HR', 'LS', 'BF', 'MBF',
] as const

export const createCostCodeSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().min(1).max(300),
  division: z.string().max(200).optional(),
  accountingRef: z.string().max(100).optional(),
})

export const updateCostCodeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(300).optional(),
  division: z.string().max(200).nullable().optional(),
  accountingRef: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
})

export const createMaterialSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  unit: z.enum(MATERIAL_UNITS).optional(),
  unitCost: z.number().nonnegative(),
  supplier: z.string().max(300).optional(),
  notes: z.string().max(2000).optional(),
  costCodeId: z.string().optional(),
})

export const updateMaterialSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  unit: z.enum(MATERIAL_UNITS).optional(),
  unitCost: z.number().nonnegative().optional(),
  supplier: z.string().max(300).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  costCodeId: z.string().nullable().optional(),
})

export type CreateCostCodeSchemaInput = z.infer<typeof createCostCodeSchema>
export type UpdateCostCodeSchemaInput = z.infer<typeof updateCostCodeSchema>
export type CreateMaterialSchemaInput = z.infer<typeof createMaterialSchema>
export type UpdateMaterialSchemaInput = z.infer<typeof updateMaterialSchema>
