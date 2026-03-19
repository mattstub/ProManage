'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [type, setType] = useState<ProjectType>('Commercial')
  const [status, setStatus] = useState<ProjectStatus>('Active')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const input: CreateProjectInput = { name, number, type, status, address: address || undefined }
      const project = await createProject.mutateAsync(input)
      onOpenChange(false)
      setName(''); setNumber(''); setType('Commercial'); setStatus('Active'); setAddress('')
      router.push(`/projects/${project.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
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
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-number">Number *</Label>
            <Input id="proj-number" value={number} onChange={(e) => setNumber(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="proj-type">Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as ProjectType)}>
                <SelectTrigger id="proj-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPE_LIST.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="proj-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger id="proj-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="proj-address">Address</Label>
            <Input id="proj-address" value={address} onChange={(e) => setAddress(e.target.value)} />
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
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: result, isLoading } = useProjects({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as ProjectStatus) : undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as ProjectType) : undefined,
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
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-status" className="text-sm text-gray-600">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" id="filter-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {PROJECT_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-type" className="text-sm text-gray-600">Type:</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36" id="filter-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {PROJECT_TYPE_LIST.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="search" className="text-sm text-gray-600">Search:</Label>
          <Input
            id="search"
            className="w-64"
            placeholder="Name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
                  <TableCell className="text-gray-600">{formatDate(project.startDate)}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(project.endDate)}</TableCell>
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
