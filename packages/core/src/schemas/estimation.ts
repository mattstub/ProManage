import { z } from 'zod'

const ESTIMATE_STATUSES = ['DRAFT', 'ACTIVE', 'AWARDED', 'LOST'] as const

const ESTIMATE_UNITS = [
  'EA', 'LF', 'SF', 'SY', 'CY', 'TON', 'LS', 'HR', 'DAY', 'MGAL', 'GAL',
] as const

export const createEstimateSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(ESTIMATE_STATUSES).optional(),
  bidDueDate: z.string().datetime().optional().nullable(),
})

export const updateEstimateSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(ESTIMATE_STATUSES).optional(),
  bidDueDate: z.string().datetime().optional().nullable(),
})

export const createEstimateItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.enum(ESTIMATE_UNITS).optional(),
  unitCost: z.number().min(0),
  costCode: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateEstimateItemSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().positive().optional(),
  unit: z.enum(ESTIMATE_UNITS).optional(),
  unitCost: z.number().min(0).optional(),
  costCode: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
})

export const createEstimateItemVendorQuoteSchema = z.object({
  vendorId: z.string().cuid(),
  unitPrice: z.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
  quotedAt: z.string().datetime(),
})

export const createBidResultSchema = z.object({
  competitorName: z.string().min(1).max(300),
  bidAmount: z.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
  isAwarded: z.boolean().optional(),
  submittedAt: z.string().datetime(),
})

export const updateBidResultSchema = z.object({
  competitorName: z.string().min(1).max(300).optional(),
  bidAmount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional().nullable(),
  isAwarded: z.boolean().optional(),
  submittedAt: z.string().datetime().optional(),
})

export type CreateEstimateSchemaInput = z.infer<typeof createEstimateSchema>
export type UpdateEstimateSchemaInput = z.infer<typeof updateEstimateSchema>
export type CreateEstimateItemSchemaInput = z.infer<typeof createEstimateItemSchema>
export type UpdateEstimateItemSchemaInput = z.infer<typeof updateEstimateItemSchema>
export type CreateEstimateItemVendorQuoteSchemaInput = z.infer<
  typeof createEstimateItemVendorQuoteSchema
>
export type CreateBidResultSchemaInput = z.infer<typeof createBidResultSchema>
export type UpdateBidResultSchemaInput = z.infer<typeof updateBidResultSchema>
