export type SafetyDocumentCategory =
  | 'POLICY'
  | 'PROCEDURE'
  | 'EMERGENCY_PLAN'
  | 'TRAINING'
  | 'COMPLIANCE'
  | 'OTHER'

export interface SafetyDocument {
  id: string
  organizationId: string
  title: string
  description: string | null
  category: SafetyDocumentCategory
  fileName: string
  fileKey: string
  fileSize: number
  mimeType: string
  projectId: string | null
  uploadedById: string
  project?: { id: string; name: string; number: string } | null
  uploadedBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateSafetyDocumentInput {
  title: string
  description?: string
  category?: SafetyDocumentCategory
  fileName: string
  fileKey: string
  fileSize: number
  mimeType: string
}

export interface UpdateSafetyDocumentInput {
  title?: string
  description?: string | null
  category?: SafetyDocumentCategory
}

// ─── SDS ─────────────────────────────────────────────────────────────────────

export interface SdsEntry {
  id: string
  organizationId: string
  productName: string
  manufacturer: string | null
  chemicalName: string | null
  sdsFileKey: string | null
  sdsFileName: string | null
  reviewDate: string | null
  notes: string | null
  createdById: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateSdsEntryInput {
  productName: string
  manufacturer?: string
  chemicalName?: string
  sdsFileKey?: string
  sdsFileName?: string
  reviewDate?: string
  notes?: string
}

export interface UpdateSdsEntryInput {
  productName?: string
  manufacturer?: string | null
  chemicalName?: string | null
  sdsFileKey?: string | null
  sdsFileName?: string | null
  reviewDate?: string | null
  notes?: string | null
}

// ─── Toolbox Talks ───────────────────────────────────────────────────────────

export type ToolboxTalkStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface ToolboxTalkAttendee {
  id: string
  talkId: string
  userId: string | null
  name: string
  signedAt: string | null
  createdAt: string
  user?: { id: string; firstName: string; lastName: string; email: string } | null
}

export interface ToolboxTalk {
  id: string
  organizationId: string
  title: string
  content: string | null
  scheduledDate: string | null
  conductedDate: string | null
  status: ToolboxTalkStatus
  projectId: string | null
  conductedById: string | null
  createdById: string
  project?: { id: string; name: string; number: string } | null
  conductedBy?: { id: string; firstName: string; lastName: string; email: string } | null
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  attendees: ToolboxTalkAttendee[]
  createdAt: string
  updatedAt: string
}

export interface CreateToolboxTalkInput {
  title: string
  content?: string
  scheduledDate?: string
  projectId?: string
}

export interface UpdateToolboxTalkInput {
  title?: string
  content?: string | null
  scheduledDate?: string | null
  conductedDate?: string | null
  status?: ToolboxTalkStatus
  conductedById?: string | null
  projectId?: string | null
}

export interface CreateToolboxTalkAttendeeInput {
  name: string
  userId?: string
  signedAt?: string
}

// ─── Safety Forms ────────────────────────────────────────────────────────────

export type SafetyFormCategory =
  | 'INSPECTION'
  | 'JSA'
  | 'HAZARD_ASSESSMENT'
  | 'PERMIT'
  | 'TAILGATE'
  | 'OTHER'

export interface SafetyForm {
  id: string
  organizationId: string
  title: string
  description: string | null
  category: SafetyFormCategory
  content: string
  isActive: boolean
  createdById: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateSafetyFormInput {
  title: string
  description?: string
  category?: SafetyFormCategory
  content?: string
}

export interface UpdateSafetyFormInput {
  title?: string
  description?: string | null
  category?: SafetyFormCategory
  content?: string
  isActive?: boolean
}

// ─── Incident Reports ────────────────────────────────────────────────────────

export type IncidentType =
  | 'NEAR_MISS'
  | 'FIRST_AID'
  | 'RECORDABLE'
  | 'PROPERTY_DAMAGE'
  | 'FATALITY'
  | 'ENVIRONMENTAL'

export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'CLOSED'

export interface IncidentReport {
  id: string
  organizationId: string
  title: string
  incidentType: IncidentType
  incidentDate: string
  location: string | null
  description: string
  correctiveAction: string | null
  status: IncidentStatus
  projectId: string | null
  reportedById: string
  project?: { id: string; name: string; number: string } | null
  reportedBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateIncidentReportInput {
  title: string
  incidentType: IncidentType
  incidentDate: string
  location?: string
  description: string
  projectId?: string
}

export interface UpdateIncidentReportInput {
  title?: string
  incidentType?: IncidentType
  incidentDate?: string
  location?: string | null
  description?: string
  correctiveAction?: string | null
  status?: IncidentStatus
  projectId?: string | null
}

// ─── Phase 4.3 — Job-Specific Safety ─────────────────────────────────────────

export type JhaStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export type EmergencyContactRole =
  | 'SITE_SUPERVISOR'
  | 'HOSPITAL'
  | 'FIRE'
  | 'POLICE'
  | 'UTILITY'
  | 'OTHER'

export interface JobHazardAnalysis {
  id: string
  organizationId: string
  projectId: string
  title: string
  description: string | null
  status: JhaStatus
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  createdById: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateJobHazardAnalysisInput {
  title: string
  description?: string
  status?: JhaStatus
  fileKey?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

export interface UpdateJobHazardAnalysisInput {
  title?: string
  description?: string | null
  status?: JhaStatus
  fileKey?: string | null
  fileName?: string | null
  fileSize?: number | null
  mimeType?: string | null
}

export interface ProjectEmergencyContact {
  id: string
  organizationId: string
  projectId: string
  name: string
  role: EmergencyContactRole
  phone: string
  address: string | null
  notes: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectEmergencyContactInput {
  name: string
  role?: EmergencyContactRole
  phone: string
  address?: string
  notes?: string
  sortOrder?: number
}

export interface UpdateProjectEmergencyContactInput {
  name?: string
  role?: EmergencyContactRole
  phone?: string
  address?: string | null
  notes?: string | null
  sortOrder?: number
}

export interface ProjectSdsEntry {
  id: string
  organizationId: string
  projectId: string
  sdsEntryId: string
  notes: string | null
  addedAt: string
  sdsEntry: {
    id: string
    productName: string
    manufacturer: string | null
    chemicalName: string | null
    sdsFileKey: string | null
    sdsFileName: string | null
    reviewDate: string | null
    notes: string | null
  }
}

export interface AddProjectSdsEntryInput {
  sdsEntryId: string
  notes?: string
}

export interface UpdateProjectSdsEntryInput {
  notes?: string | null
}
