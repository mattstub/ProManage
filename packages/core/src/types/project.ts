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
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectInput {
  name: string
  number: string
  type: ProjectType
  description?: string
  address?: string
  startDate?: Date
  endDate?: Date
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
}
