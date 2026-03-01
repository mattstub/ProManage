import type { RoleName } from '../types/role'

export const USER_ROLES: Record<RoleName, { label: string; description: string }> = {
  Admin: {
    label: 'Administrator',
    description: 'Full system access. Manages users, organization settings, and all modules.',
  },
  ProjectManager: {
    label: 'Project Manager',
    description: 'Oversees projects, reviews reports, approves time entries, and manages budgets.',
  },
  Superintendent: {
    label: 'Superintendent',
    description: 'Manages daily site operations, submits daily reports, and tracks crew time.',
  },
  Foreman: {
    label: 'Foreman',
    description: 'Manages specific crews and reports work progress.',
  },
  FieldUser: {
    label: 'Field User',
    description: 'General field worker. Clocks time, submits reports, and accesses safety documents.',
  },
  OfficeAdmin: {
    label: 'Office Administrator',
    description: 'Handles user management, documentation, and coordination.',
  },
} as const

export const ROLE_NAMES = Object.keys(USER_ROLES) as RoleName[]
