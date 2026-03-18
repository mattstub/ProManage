import { z } from 'zod'

const SAFETY_DOCUMENT_CATEGORIES = [
  'POLICY',
  'PROCEDURE',
  'EMERGENCY_PLAN',
  'TRAINING',
  'COMPLIANCE',
  'OTHER',
] as const

const TOOLBOX_TALK_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const

const SAFETY_FORM_CATEGORIES = [
  'INSPECTION',
  'JSA',
  'HAZARD_ASSESSMENT',
  'PERMIT',
  'TAILGATE',
  'OTHER',
] as const

const INCIDENT_TYPES = [
  'NEAR_MISS',
  'FIRST_AID',
  'RECORDABLE',
  'PROPERTY_DAMAGE',
  'FATALITY',
  'ENVIRONMENTAL',
] as const

const INCIDENT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'CLOSED'] as const

// ─── Safety Documents ────────────────────────────────────────────────────────

export const createSafetyDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(SAFETY_DOCUMENT_CATEGORIES).optional(),
  fileName: z.string().min(1).max(500),
  fileKey: z.string().min(1).max(500),
  fileSize: z.number().int().min(1),
  mimeType: z.string().min(1).max(100),
})

export const updateSafetyDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(SAFETY_DOCUMENT_CATEGORIES).optional(),
})

// ─── SDS ─────────────────────────────────────────────────────────────────────

export const createSdsEntrySchema = z.object({
  productName: z.string().min(1).max(200),
  manufacturer: z.string().max(200).optional(),
  chemicalName: z.string().max(200).optional(),
  sdsFileKey: z.string().max(500).optional(),
  sdsFileName: z.string().max(500).optional(),
  reviewDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
})

export const updateSdsEntrySchema = z.object({
  productName: z.string().min(1).max(200).optional(),
  manufacturer: z.string().max(200).nullable().optional(),
  chemicalName: z.string().max(200).nullable().optional(),
  sdsFileKey: z.string().max(500).nullable().optional(),
  sdsFileName: z.string().max(500).nullable().optional(),
  reviewDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

// ─── Toolbox Talks ───────────────────────────────────────────────────────────

export const createToolboxTalkSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(5000).optional(),
  scheduledDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
})

export const updateToolboxTalkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(5000).nullable().optional(),
  scheduledDate: z.string().datetime().nullable().optional(),
  conductedDate: z.string().datetime().nullable().optional(),
  status: z.enum(TOOLBOX_TALK_STATUSES).optional(),
  conductedById: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
})

export const createToolboxTalkAttendeeSchema = z.object({
  name: z.string().min(1).max(200),
  userId: z.string().optional(),
  signedAt: z.string().datetime().optional(),
})

// ─── Safety Forms ────────────────────────────────────────────────────────────

export const createSafetyFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(SAFETY_FORM_CATEGORIES).optional(),
  content: z.string().max(10000).optional(),
})

export const updateSafetyFormSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(SAFETY_FORM_CATEGORIES).optional(),
  content: z.string().max(10000).optional(),
  isActive: z.boolean().optional(),
})

// ─── Incident Reports ────────────────────────────────────────────────────────

export const createIncidentReportSchema = z.object({
  title: z.string().min(1).max(200),
  incidentType: z.enum(INCIDENT_TYPES),
  incidentDate: z.string().datetime(),
  location: z.string().max(300).optional(),
  description: z.string().min(1).max(5000),
  projectId: z.string().optional(),
})

export const updateIncidentReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  incidentType: z.enum(INCIDENT_TYPES).optional(),
  incidentDate: z.string().datetime().optional(),
  location: z.string().max(300).nullable().optional(),
  description: z.string().min(1).max(5000).optional(),
  correctiveAction: z.string().max(5000).nullable().optional(),
  status: z.enum(INCIDENT_STATUSES).optional(),
  projectId: z.string().nullable().optional(),
})

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateSafetyDocumentSchema = z.infer<typeof createSafetyDocumentSchema>
export type UpdateSafetyDocumentSchema = z.infer<typeof updateSafetyDocumentSchema>
export type CreateSdsEntrySchema = z.infer<typeof createSdsEntrySchema>
export type UpdateSdsEntrySchema = z.infer<typeof updateSdsEntrySchema>
export type CreateToolboxTalkSchema = z.infer<typeof createToolboxTalkSchema>
export type UpdateToolboxTalkSchema = z.infer<typeof updateToolboxTalkSchema>
export type CreateToolboxTalkAttendeeSchema = z.infer<typeof createToolboxTalkAttendeeSchema>
export type CreateSafetyFormSchema = z.infer<typeof createSafetyFormSchema>
export type UpdateSafetyFormSchema = z.infer<typeof updateSafetyFormSchema>
export type CreateIncidentReportSchema = z.infer<typeof createIncidentReportSchema>
export type UpdateIncidentReportSchema = z.infer<typeof updateIncidentReportSchema>
