import type { ProjectScopeStatus, ProjectStatus, ProjectType } from '../types/project'

export const PROJECT_STATUSES: Record<
  ProjectStatus,
  { label: string; description: string }
> = {
  Bidding: {
    label: 'Bidding',
    description: 'Project is in the estimation and bidding phase.',
  },
  PreConstruction: {
    label: 'Pre-Construction',
    description:
      'Project has been awarded. Contracts, submittals, and planning are underway.',
  },
  Active: {
    label: 'Active',
    description: 'Construction is actively in progress.',
  },
  OnHold: {
    label: 'On Hold',
    description: 'Project is temporarily paused.',
  },
  Completed: {
    label: 'Completed',
    description:
      'Construction is substantially complete. Punch list and closeout in progress.',
  },
  Closed: {
    label: 'Closed',
    description: 'Project is fully closed out and archived.',
  },
}

export const PROJECT_TYPES: Record<
  ProjectType,
  { label: string }
> = {
  Commercial: { label: 'Commercial' },
  Residential: { label: 'Residential' },
  Industrial: { label: 'Industrial' },
  Municipal: { label: 'Municipal' },
  Institutional: { label: 'Institutional' },
}

export const PROJECT_STATUS_LIST = Object.keys(
  PROJECT_STATUSES
) as ProjectStatus[]
export const PROJECT_TYPE_LIST = Object.keys(PROJECT_TYPES) as ProjectType[]

export const PROJECT_SCOPE_STATUSES: Record<ProjectScopeStatus, { label: string }> = {
  Active: { label: 'Active' },
  Completed: { label: 'Completed' },
  OnHold: { label: 'On Hold' },
  Cancelled: { label: 'Cancelled' },
}

export const PROJECT_SCOPE_STATUS_LIST = Object.keys(
  PROJECT_SCOPE_STATUSES
) as ProjectScopeStatus[]
