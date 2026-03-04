'use client'

import { Grid } from '@promanage/ui-components'

import { ProjectSummaryList } from '@/components/dashboard/project-summary-list'
import { StatsCard } from '@/components/dashboard/stats-card'
import { useAuth } from '@/hooks/use-auth'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { useOrganization } from '@/hooks/use-organization'
import { useProjects } from '@/hooks/use-projects'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: org, isLoading: orgLoading } = useOrganization()
  const { data: projectsResult, isLoading: projectsLoading } = useProjects({ perPage: 5 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your projects.
        </p>
      </div>

      <Grid cols={3} gap={6}>
        <StatsCard
          title="Active Projects"
          value={stats?.activeProjectCount ?? '—'}
          description={
            stats
              ? `${stats.totalProjectCount} total project${stats.totalProjectCount !== 1 ? 's' : ''}`
              : undefined
          }
          isLoading={statsLoading}
          variant="blue"
        />
        <StatsCard
          title="Team Members"
          value={stats?.teamMemberCount ?? '—'}
          isLoading={statsLoading}
          variant="green"
        />
        <StatsCard
          title="Organization"
          value={org?.name ?? '—'}
          isLoading={orgLoading}
        />
      </Grid>

      <ProjectSummaryList
        projects={projectsResult?.data ?? []}
        isLoading={projectsLoading}
      />
    </div>
  )
}
