import { z } from 'zod'

const CONTRACT_TYPES = ['LUMP_SUM', 'COST_PLUS', 'TIME_AND_MATERIALS', 'UNIT_PRICE'] as const
const CONTRACT_STATUSES = [
  'DRAFT',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'COMPLETED',
  'TERMINATED',
  'ON_HOLD',
] as const
const CONTRACT_DOCUMENT_TYPES = [
  'INSURANCE',
  'BONDING',
  'SALES_TAX_REQUEST',
  'SALES_TAX_EXEMPTION',
  'OTHER',
] as const
const CONTRACT_DOCUMENT_STATUSES = ['REQUESTED', 'RECEIVED', 'EXPIRED', 'WAIVED'] as const

export const createContractSchema = z.object({
  projectId: z.string().min(1),
  proposalId: z.string().min(1).optional(),
  contractNumber: z.string().min(1).max(100),
  type: z.enum(CONTRACT_TYPES),
  amount: z.number().nonnegative(),
  customerProjectNumber: z.string().max(100).optional(),
  retentionRate: z.number().min(0).max(100).optional(),
  wageRequirements: z.string().max(500).optional(),
  taxStatus: z.string().max(100).optional(),
  liquidatedDamages: z.boolean().optional(),
  liquidatedDamagesRate: z.number().nonnegative().optional(),
  bonded: z.boolean().optional(),
  billingDate: z.string().datetime({ offset: true }).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  executedDate: z.string().datetime({ offset: true }).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
})

export const updateContractSchema = z.object({
  contractNumber: z.string().min(1).max(100).optional(),
  type: z.enum(CONTRACT_TYPES).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  amount: z.number().nonnegative().optional(),
  customerProjectNumber: z.string().max(100).optional(),
  retentionRate: z.number().min(0).max(100).optional(),
  wageRequirements: z.string().max(500).optional(),
  taxStatus: z.string().max(100).optional(),
  liquidatedDamages: z.boolean().optional(),
  liquidatedDamagesRate: z.number().nonnegative().optional(),
  bonded: z.boolean().optional(),
  billingDate: z.string().datetime({ offset: true }).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  executedDate: z.string().datetime({ offset: true }).optional(),
  description: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
})

export const createContractDocumentSchema = z.object({
  type: z.enum(CONTRACT_DOCUMENT_TYPES),
  name: z.string().min(1).max(200),
  notes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
})

export const updateContractDocumentSchema = z.object({
  type: z.enum(CONTRACT_DOCUMENT_TYPES).optional(),
  name: z.string().min(1).max(200).optional(),
  status: z.enum(CONTRACT_DOCUMENT_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  receivedAt: z.string().datetime({ offset: true }).optional(),
})
