import type { ProjectStatus } from './project'

export interface DashboardStats {
  activeProjectCount: number
  totalProjectCount: number
  teamMemberCount: number
  projectsByStatus: Record<ProjectStatus, number>
}
