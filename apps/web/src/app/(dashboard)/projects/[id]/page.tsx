'use client'

import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

import { Badge, Skeleton, type BadgeProps } from '@promanage/ui-components'
import type { ProjectStatus } from '@promanage/core'

import { useProjectDashboard } from '@/hooks/use-projects'

const STATUS_VARIANT: Record<ProjectStatus, BadgeProps['variant']> = {
  Active: 'success',
  Bidding: 'primary',
  PreConstruction: 'primary',
  OnHold: 'warning',
  Completed: 'default',
  Closed: 'default',
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  Active: 'Active',
  Bidding: 'Bidding',
  PreConstruction: 'Pre-Con',
  OnHold: 'On Hold',
  Completed: 'Completed',
  Closed: 'Closed',
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex items-center gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-10 mt-1" />
        ) : (
          <p className="text-2xl font-semibold text-gray-900">{value ?? 0}</p>
        )}
      </div>
    </div>
  )
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const { data: dashboard, isLoading } = useProjectDashboard(params.id)

  const project = dashboard?.project
  const metrics = dashboard?.metrics

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={ClipboardDocumentListIcon}
          label="Open Tasks"
          value={metrics?.openTaskCount}
          loading={isLoading}
        />
        <MetricCard
          icon={ExclamationTriangleIcon}
          label="Open Incidents"
          value={metrics?.openIncidentCount}
          loading={isLoading}
        />
        <MetricCard
          icon={MegaphoneIcon}
          label="Toolbox Talks"
          value={metrics?.scheduledToolboxTalksCount}
          loading={isLoading}
        />
        <MetricCard
          icon={CalendarDaysIcon}
          label="Upcoming Events"
          value={metrics?.upcomingEventsCount}
          loading={isLoading}
        />
      </div>

      {/* Project details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Project Details</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  {project && (
                    <Badge variant={STATUS_VARIANT[project.status as ProjectStatus]}>
                      {STATUS_LABEL[project.status as ProjectStatus] ?? project.status}
                    </Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900">{project?.type ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(project?.startDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(project?.endDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium text-gray-900 text-right max-w-48">
                  {project?.address ?? '—'}
                </dd>
              </div>
              {project?.squareFootage && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sq. Footage</dt>
                  <dd className="font-medium text-gray-900">
                    {project.squareFootage.toLocaleString()} sf
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Owner & Contractor</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Owner</dt>
                <dd className="font-medium text-gray-900">{project?.ownerName ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Owner Phone</dt>
                <dd className="font-medium text-gray-900">{project?.ownerPhone ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Architect</dt>
                <dd className="font-medium text-gray-900">{project?.architectName ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Permit #</dt>
                <dd className="font-medium text-gray-900">{project?.permitNumber ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Contractor License</dt>
                <dd className="font-medium text-gray-900">{project?.contractorLicense ?? '—'}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Scope progress */}
      {(isLoading || (metrics?.scopeProgress?.length ?? 0) > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Scope Progress</h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-3/4" />
              ))}
            </div>
          ) : (
            metrics?.scopeProgress?.map((scope) => (
              <div key={scope.scopeId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{scope.scopeName}</span>
                <Badge variant="default">{scope.status}</Badge>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
