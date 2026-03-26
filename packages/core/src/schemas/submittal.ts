import { z } from 'zod'

const SUBMITTAL_TYPES = [
  'SHOP_DRAWINGS',
  'PRODUCT_DATA',
  'SAMPLES',
  'MOCKUPS',
  'CALCULATIONS',
  'VENDOR_INFO',
  'WARRANTIES',
  'MANUALS',
  'AS_BUILTS',
] as const

const SUBMITTAL_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'APPROVED_AS_NOTED',
  'REVISE_RESUBMIT',
  'REJECTED',
  'VOID',
] as const

export const createSubmittalSchema = z.object({
  projectId: z.string().min(1),
  submittalNumber: z.string().min(1).max(100),
  specSection: z.string().max(100).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(SUBMITTAL_TYPES),
  revision: z.number().int().min(1).optional(),
  submittedDate: z.string().datetime({ offset: true }).optional(),
  requiredByDate: z.string().datetime({ offset: true }).optional(),
  returnedDate: z.string().datetime({ offset: true }).optional(),
  ballInCourt: z.string().max(100).optional(),
  approver: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
})

export const updateSubmittalSchema = z.object({
  submittalNumber: z.string().min(1).max(100).optional(),
  specSection: z.string().max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(SUBMITTAL_TYPES).optional(),
  status: z.enum(SUBMITTAL_STATUSES).optional(),
  revision: z.number().int().min(1).optional(),
  submittedDate: z.string().datetime({ offset: true }).optional(),
  requiredByDate: z.string().datetime({ offset: true }).optional(),
  returnedDate: z.string().datetime({ offset: true }).optional(),
  ballInCourt: z.string().max(100).optional(),
  approver: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
})

export const createSubmittalDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
})

export const updateSubmittalDocumentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).optional(),
})
