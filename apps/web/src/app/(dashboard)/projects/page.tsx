'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import {
  Badge,
  Breadcrumbs,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@promanage/ui-components'

import type { Project, ProjectStatus, RoleName } from '@promanage/core'
import type { BadgeProps } from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'


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

const CREATE_ROLES: RoleName[] = ['Admin', 'ProjectManager']

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ProjectsTableSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { data: result, isLoading } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)

  const projects: Project[] = result?.data ?? []
  const canCreate = CREATE_ROLES.some((r) => user?.roles.includes(r))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Projects' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Projects</h1>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ProjectsTableSkeleton />
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No projects found.{' '}
                  {canCreate && (
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Create your first project.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-sm text-gray-600">
                    #{project.number}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {project.name}
                  </TableCell>
                  <TableCell className="text-gray-600">{project.type}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[project.status as ProjectStatus]}>
                      {STATUS_LABEL[project.status as ProjectStatus] ?? project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(project.startDate)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(project.endDate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 py-4">
            Project creation form coming soon.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
