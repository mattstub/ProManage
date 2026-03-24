import { z } from 'zod'

const PROPOSAL_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'REVISED'] as const

const proposalLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0),
  notes: z.string().max(1000).nullish(),
  sortOrder: z.number().int().min(0).default(0),
})

export const createProposalSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
  templateId: z.string().cuid().optional(),
  coverLetter: z.string().max(10000).optional(),
  terms: z.string().max(10000).optional(),
  validUntil: z.string().datetime({ offset: true }).optional(),
  lineItems: z.array(proposalLineItemSchema).max(200).default([]),
})

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(PROPOSAL_STATUSES).optional(),
  projectId: z.string().cuid().nullish(),
  customerId: z.string().cuid().nullish(),
  coverLetter: z.string().max(10000).nullish(),
  terms: z.string().max(10000).nullish(),
  validUntil: z.string().datetime({ offset: true }).nullish(),
  submittedAt: z.string().datetime({ offset: true }).nullish(),
})

export const upsertProposalLineItemsSchema = z.object({
  lineItems: z.array(proposalLineItemSchema).max(200),
})

export const createProposalTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  coverLetter: z.string().max(10000).optional(),
  terms: z.string().max(10000).optional(),
})

export const updateProposalTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullish(),
  coverLetter: z.string().max(10000).nullish(),
  terms: z.string().max(10000).nullish(),
  isActive: z.boolean().optional(),
})

export type CreateProposalSchemaInput = z.infer<typeof createProposalSchema>
export type UpdateProposalSchemaInput = z.infer<typeof updateProposalSchema>
export type UpsertProposalLineItemsSchemaInput = z.infer<typeof upsertProposalLineItemsSchema>
export type CreateProposalTemplateSchemaInput = z.infer<typeof createProposalTemplateSchema>
export type UpdateProposalTemplateSchemaInput = z.infer<typeof updateProposalTemplateSchema>
