// Drawing phases
export type DrawingPhase = 'DESIGN_DEVELOPMENT' | 'BIDDING_DOCUMENTS' | 'CONSTRUCTION_DOCUMENTS'

// ─── Disciplines ─────────────────────────────────────────────────────────────

export interface DrawingDiscipline {
  id: string
  name: string
  abbreviation: string | null
  sortOrder: number
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateDrawingDisciplineInput {
  name: string
  abbreviation?: string
  sortOrder?: number
}

export interface UpdateDrawingDisciplineInput {
  name?: string
  abbreviation?: string | null
  sortOrder?: number
}

// ─── Drawing Sets ─────────────────────────────────────────────────────────────

export interface DrawingSet {
  id: string
  name: string
  phase: DrawingPhase
  issueDate: string | null
  issuedBy: string | null
  description: string | null
  organizationId: string
  projectId: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface CreateDrawingSetInput {
  name: string
  phase?: DrawingPhase
  issueDate?: string | null
  issuedBy?: string | null
  description?: string | null
}

export interface UpdateDrawingSetInput {
  name?: string
  phase?: DrawingPhase
  issueDate?: string | null
  issuedBy?: string | null
  description?: string | null
}

// ─── Drawing Sheets ───────────────────────────────────────────────────────────

export interface DrawingSheet {
  id: string
  sheetNumber: string
  title: string
  sortOrder: number
  organizationId: string
  projectId: string
  disciplineId: string | null
  createdAt: string
  updatedAt: string
}

export interface DrawingSheetWithRevision extends DrawingSheet {
  discipline: DrawingDiscipline | null
  currentRevision: DrawingRevision | null
  revisionCount: number
}

export interface CreateDrawingSheetInput {
  sheetNumber: string
  title: string
  disciplineId?: string | null
  sortOrder?: number
}

export interface UpdateDrawingSheetInput {
  sheetNumber?: string
  title?: string
  disciplineId?: string | null
  sortOrder?: number
}

// ─── Drawing Revisions ────────────────────────────────────────────────────────

export interface DrawingRevision {
  id: string
  revisionNumber: string
  revisionDate: string
  description: string | null
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  isCurrent: boolean
  organizationId: string
  sheetId: string
  drawingSetId: string | null
  uploadedById: string
  createdAt: string
}

export interface AddDrawingRevisionInput {
  revisionNumber: string
  revisionDate: string
  description?: string | null
  drawingSetId?: string | null
  // File fields — populated after upload confirmation
  fileKey?: string | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
}

// ─── Specification Sections ───────────────────────────────────────────────────

export interface SpecificationSection {
  id: string
  sectionNumber: string
  title: string
  description: string | null
  sortOrder: number
  organizationId: string
  projectId: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface SpecificationSectionWithRevision extends SpecificationSection {
  currentRevision: SpecificationRevision | null
  revisionCount: number
}

export interface CreateSpecificationSectionInput {
  sectionNumber: string
  title: string
  description?: string | null
  sortOrder?: number
}

export interface UpdateSpecificationSectionInput {
  sectionNumber?: string
  title?: string
  description?: string | null
  sortOrder?: number
}

// ─── Specification Revisions ──────────────────────────────────────────────────

export interface SpecificationRevision {
  id: string
  revisionNumber: number
  revisionDate: string
  description: string | null
  isAmendment: boolean
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  isCurrent: boolean
  organizationId: string
  sectionId: string
  uploadedById: string
  createdAt: string
}

export interface AddSpecificationRevisionInput {
  revisionDate: string
  description?: string | null
  isAmendment?: boolean
  fileKey?: string | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
}
