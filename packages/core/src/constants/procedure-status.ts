import type { ProcedureCategory, ProcedureStatus } from '../types/procedure'

export const PROCEDURE_STATUSES: Record<
  ProcedureStatus,
  { label: string; description: string }
> = {
  DRAFT: {
    label: 'Draft',
    description: 'Procedure is being written and is not yet active.',
  },
  PUBLISHED: {
    label: 'Published',
    description: 'Procedure is active and visible to all users.',
  },
  ARCHIVED: {
    label: 'Archived',
    description: 'Procedure is retired and no longer in use.',
  },
}

export const PROCEDURE_CATEGORIES: Record<ProcedureCategory, { label: string }> = {
  General: { label: 'General' },
  Safety: { label: 'Safety' },
  Quality: { label: 'Quality' },
  HR: { label: 'HR' },
  Finance: { label: 'Finance' },
  Operations: { label: 'Operations' },
}

export const PROCEDURE_STATUS_LIST = Object.keys(PROCEDURE_STATUSES) as ProcedureStatus[]
export const PROCEDURE_CATEGORY_LIST = Object.keys(PROCEDURE_CATEGORIES) as ProcedureCategory[]
