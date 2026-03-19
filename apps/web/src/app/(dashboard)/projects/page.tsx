'use client'

import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  PROJECT_STATUS_LIST,
  PROJECT_TYPE_LIST,
  type CreateProjectInput,
  type ProjectStatus,
  type ProjectType,
  type RoleName,
} from '@promanage/core'
import {
  Badge,
  Breadcrumbs,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type BadgeProps,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import { useCreateProject, useProjects } from '@/hooks/use-projects'

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

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createProject = useCreateProject()
  const router = useRouter()
  const [form, setForm] = useState<Partial<CreateProjectInput>>({})
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const project = await createProject.mutateAsync(form as CreateProjectInput)
      onOpenChange(false)
      setForm({})
      router.push(`/projects/${project.id}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create project'
      setError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="proj-name">Name *</Label>
            <Input
              id="proj-name"
              value={form.name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-number">Number *</Label>
            <Input
              id="proj-number"
              value={form.number ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-type">Type *</Label>
            <Select
              value={form.type ?? ''}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as ProjectType }))}
            >
              <SelectTrigger id="proj-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_TYPE_LIST.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-status">Status</Label>
            <Select
              value={form.status ?? 'Active'}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}
            >
              <SelectTrigger id="proj-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_LIST.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-address">Address</Label>
            <Input
              id="proj-address"
              value={form.address ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || undefined }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating…' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<ProjectType | ''>('')

  const { data: result, isLoading } = useProjects({
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  })

  const projects = result?.data ?? []
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | '')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {PROJECT_STATUS_LIST.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ProjectType | '')}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {PROJECT_TYPE_LIST.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
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

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
