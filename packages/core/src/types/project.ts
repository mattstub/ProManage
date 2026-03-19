export type ProjectType =
  | 'Commercial'
  | 'Residential'
  | 'Industrial'
  | 'Municipal'
  | 'Institutional'

export type ProjectStatus =
  | 'Bidding'
  | 'PreConstruction'
  | 'Active'
  | 'OnHold'
  | 'Completed'
  | 'Closed'

export type ProjectScopeStatus = 'Active' | 'Completed' | 'OnHold' | 'Cancelled'

export interface Project {
  id: string
  name: string
  number: string
  type: ProjectType
  status: ProjectStatus
  description?: string | null
  address?: string | null
  startDate?: Date | null
  endDate?: Date | null
  // Extended metadata (Phase 4.1)
  ownerName?: string | null
  ownerPhone?: string | null
  ownerEmail?: string | null
  architectName?: string | null
  contractorLicense?: string | null
  permitNumber?: string | null
  budget?: string | null
  squareFootage?: number | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectScope {
  id: string
  name: string
  description?: string | null
  status: ProjectScopeStatus
  sequence: number
  startDate?: Date | null
  endDate?: Date | null
  budget?: string | null
  projectId: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface ProjectSettings {
  id: string
  projectId: string
  requireDailyReports: boolean
  requireTimeTracking: boolean
  enableSafetyModule: boolean
  enableDocumentsModule: boolean
  defaultView: string
  notifyOnIncident: boolean
  notifyOnDailyReport: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProjectContactAssignment {
  assignedAt: string
  role?: string | null
  contact: {
    id: string
    firstName: string
    lastName: string
    company: string | null
    type: string
    email: string | null
    phone: string | null
    mobile: string | null
    title: string | null
  }
}

export interface ProjectWithRelations extends Project {
  scopes: ProjectScope[]
  settings: ProjectSettings | null
  contactProjects: ProjectContactAssignment[]
  _count: {
    tasks: number
    incidentReports: number
    toolboxTalks: number
    channels: number
  }
}

export interface ProjectDashboardMetrics {
  openTaskCount: number
  overdueTaskCount: number
  openIncidentCount: number
  upcomingEventsCount: number
  scheduledToolboxTalksCount: number
  activeContactCount: number
  scopeProgress: Array<{
    scopeId: string
    scopeName: string
    status: ProjectScopeStatus
  }>
}

export interface ProjectDashboard {
  project: ProjectWithRelations
  metrics: ProjectDashboardMetrics
}

export interface CreateProjectInput {
  name: string
  number: string
  type: ProjectType
  status?: ProjectStatus
  description?: string
  address?: string
  startDate?: Date
  endDate?: Date
  ownerName?: string
  ownerPhone?: string
  ownerEmail?: string
  architectName?: string
  contractorLicense?: string
  permitNumber?: string
  budget?: number
  squareFootage?: number
}

export interface UpdateProjectInput {
  name?: string
  number?: string
  type?: ProjectType
  status?: ProjectStatus
  description?: string | null
  address?: string | null
  startDate?: Date | null
  endDate?: Date | null
  ownerName?: string | null
  ownerPhone?: string | null
  ownerEmail?: string | null
  architectName?: string | null
  contractorLicense?: string | null
  permitNumber?: string | null
  budget?: number | null
  squareFootage?: number | null
}

export interface CreateProjectScopeInput {
  name: string
  description?: string
  status?: ProjectScopeStatus
  sequence?: number
  startDate?: Date
  endDate?: Date
  budget?: number
}

export interface UpdateProjectScopeInput {
  name?: string
  description?: string | null
  status?: ProjectScopeStatus
  sequence?: number
  startDate?: Date | null
  endDate?: Date | null
  budget?: number | null
}

export interface UpdateProjectSettingsInput {
  requireDailyReports?: boolean
  requireTimeTracking?: boolean
  enableSafetyModule?: boolean
  enableDocumentsModule?: boolean
  defaultView?: string
  notifyOnIncident?: boolean
  notifyOnDailyReport?: boolean
}

export interface AssignContactToProjectInput {
  role?: string | null
}
