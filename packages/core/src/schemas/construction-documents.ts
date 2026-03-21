import { z } from 'zod'

// ─── Disciplines ─────────────────────────────────────────────────────────────

export const createDrawingDisciplineSchema = z.object({
  name: z.string().min(1).max(100),
  abbreviation: z.string().max(10).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const updateDrawingDisciplineSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  abbreviation: z.string().max(10).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

// ─── Drawing Sets ─────────────────────────────────────────────────────────────

const drawingPhases = ['DESIGN_DEVELOPMENT', 'BIDDING_DOCUMENTS', 'CONSTRUCTION_DOCUMENTS'] as const

export const createDrawingSetSchema = z.object({
  name: z.string().min(1).max(200),
  phase: z.enum(drawingPhases).optional(),
  issueDate: z.string().datetime().optional().nullable(),
  issuedBy: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

export const updateDrawingSetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phase: z.enum(drawingPhases).optional(),
  issueDate: z.string().datetime().optional().nullable(),
  issuedBy: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
})

// ─── Drawing Sheets ───────────────────────────────────────────────────────────

export const createDrawingSheetSchema = z.object({
  sheetNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(300),
  disciplineId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

export const updateDrawingSheetSchema = z.object({
  sheetNumber: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(300).optional(),
  disciplineId: z.string().cuid().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

// ─── Drawing Revisions ────────────────────────────────────────────────────────

export const addDrawingRevisionSchema = z.object({
  revisionNumber: z.string().min(1).max(20),
  revisionDate: z.string().datetime(),
  description: z.string().max(1000).optional().nullable(),
  drawingSetId: z.string().cuid().optional().nullable(),
  fileKey: z.string().optional().nullable(),
  fileName: z.string().max(500).optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
})

// ─── Specification Sections ───────────────────────────────────────────────────

export const createSpecificationSectionSchema = z.object({
  sectionNumber: z.string().min(1).max(50),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

export const updateSpecificationSectionSchema = z.object({
  sectionNumber: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

// ─── Specification Revisions ──────────────────────────────────────────────────

export const addSpecificationRevisionSchema = z.object({
  revisionDate: z.string().datetime(),
  description: z.string().max(1000).optional().nullable(),
  isAmendment: z.boolean().optional(),
  fileKey: z.string().optional().nullable(),
  fileName: z.string().max(500).optional().nullable(),
  fileSize: z.number().int().positive().optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
})
