'use client'

import Link from 'next/link'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@promanage/ui-components'

import type { Project, ProjectStatus } from '@promanage/core'
import type { BadgeProps } from '@promanage/ui-components'

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

interface ProjectSummaryListProps {
  projects: Project[]
  isLoading?: boolean
}

export function ProjectSummaryList({ projects, isLoading = false }: ProjectSummaryListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-gray-900">
          Recent Projects
        </CardTitle>
        <Link
          href="/projects"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No projects yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{project.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    #{project.number} &middot; {project.type}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[project.status as ProjectStatus]}>
                  {STATUS_LABEL[project.status as ProjectStatus] ?? project.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
