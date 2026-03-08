'use client'

import {
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

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
  Textarea,
} from '@promanage/ui-components'

import type {
  ProcedureCategory,
  ProcedureStatus,
  ProcedureWithRelations,
  RoleName,
} from '@promanage/core'
import type { BadgeProps } from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import {
  useCreateProcedure,
  useDeleteProcedure,
  useProcedures,
  useUpdateProcedure,
} from '@/hooks/use-procedures'

const STATUS_VARIANT: Record<ProcedureStatus, BadgeProps['variant']> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'default',
}

const STATUS_LABEL: Record<ProcedureStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

const STATUS_OPTIONS: ProcedureStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

const CATEGORY_OPTIONS: ProcedureCategory[] = [
  'General',
  'Safety',
  'Quality',
  'HR',
  'Finance',
  'Operations',
]

const MANAGE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin']

interface ProcedureFormData {
  title: string
  content: string
  category: string
  status?: ProcedureStatus
  projectId: string
}

const initialFormData: ProcedureFormData = {
  title: '',
  content: '',
  category: 'General',
  projectId: '',
}

function ProceduresTableSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function ProceduresPage() {
  const { user } = useAuth()
  const { data: proceduresResult, isLoading } = useProcedures()
  const { data: projectsResult } = useProjects()

  const createProcedure = useCreateProcedure()
  const updateProcedure = useUpdateProcedure()
  const deleteProcedure = useDeleteProcedure()

  const [createOpen, setCreateOpen] = useState(false)
  const [editProcedure, setEditProcedure] = useState<ProcedureWithRelations | null>(null)
  const [viewProcedure, setViewProcedure] = useState<ProcedureWithRelations | null>(null)
  const [deleteConfirmProcedure, setDeleteConfirmProcedure] = useState<ProcedureWithRelations | null>(null)
  const [formData, setFormData] = useState<ProcedureFormData>(initialFormData)
  const [filterStatus, setFilterStatus] = useState<ProcedureStatus | 'ALL'>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')

  const procedures: ProcedureWithRelations[] = proceduresResult?.data ?? []
  const projects = projectsResult?.data ?? []

  const userRoles = user?.roles ?? []
  const canManage = MANAGE_ROLES.some((r) => userRoles.includes(r))
  const canDelete = DELETE_ROLES.some((r) => userRoles.includes(r))

  const filteredProcedures = procedures.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false
    return true
  })

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setCreateOpen(true)
  }

  const handleOpenEdit = (procedure: ProcedureWithRelations) => {
    setFormData({
      title: procedure.title,
      content: procedure.content,
      category: procedure.category,
      status: procedure.status,
      projectId: procedure.projectId ?? '',
    })
    setEditProcedure(procedure)
  }

  const handleCloseDialogs = () => {
    setCreateOpen(false)
    setEditProcedure(null)
    setViewProcedure(null)
    setDeleteConfirmProcedure(null)
    setFormData(initialFormData)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProcedure.mutateAsync({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      projectId: formData.projectId || undefined,
    })
    handleCloseDialogs()
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProcedure) return
    await updateProcedure.mutateAsync({
      id: editProcedure.id,
      title: formData.title,
      content: formData.content,
      category: formData.category,
      status: formData.status,
      projectId: formData.projectId || null,
    })
    handleCloseDialogs()
  }

  const handleDelete = async () => {
    if (!deleteConfirmProcedure) return
    await deleteProcedure.mutateAsync(deleteConfirmProcedure.id)
    handleCloseDialogs()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Procedures' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Procedures</h1>
        </div>
        {canManage && (
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Procedure
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-status" className="text-sm text-gray-600">
            Status:
          </Label>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as ProcedureStatus | 'ALL')}
          >
            <SelectTrigger className="w-36" id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-category" className="text-sm text-gray-600">
            Category:
          </Label>
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="w-36" id="filter-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ProceduresTableSkeleton />
            ) : filteredProcedures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No procedures found.{' '}
                  {canManage && (
                    <button
                      onClick={handleOpenCreate}
                      className="text-blue-600 hover:underline"
                    >
                      Create your first procedure.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredProcedures.map((procedure) => (
                <TableRow key={procedure.id}>
                  <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                    {procedure.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[procedure.status as ProcedureStatus]}>
                      {STATUS_LABEL[procedure.status as ProcedureStatus] ?? procedure.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{procedure.category}</TableCell>
                  <TableCell className="text-gray-600">
                    {procedure.project
                      ? `#${procedure.project.number} ${procedure.project.name}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {procedure.createdBy.firstName} {procedure.createdBy.lastName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewProcedure(procedure)}
                        title="View procedure"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </Button>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(procedure)}
                          title="Edit procedure"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmProcedure(procedure)}
                          title="Delete procedure"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Procedure Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Procedure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter procedure title"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <Select
                  value={formData.projectId || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        #{project.number} {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter procedure content, steps, or instructions..."
                rows={8}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createProcedure.isPending}>
                {createProcedure.isPending ? 'Creating...' : 'Create Procedure'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Procedure Dialog */}
      <Dialog open={!!editProcedure} onOpenChange={() => setEditProcedure(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Procedure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter procedure title"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ProcedureStatus })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-projectId">Project</Label>
                <Select
                  value={formData.projectId || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger id="edit-projectId">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        #{project.number} {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter procedure content, steps, or instructions..."
                rows={8}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={updateProcedure.isPending}>
                {updateProcedure.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Procedure Dialog */}
      <Dialog open={!!viewProcedure} onOpenChange={() => setViewProcedure(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewProcedure?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              {viewProcedure && (
                <Badge variant={STATUS_VARIANT[viewProcedure.status as ProcedureStatus]}>
                  {STATUS_LABEL[viewProcedure.status as ProcedureStatus] ?? viewProcedure.status}
                </Badge>
              )}
              <span className="text-sm text-gray-500">{viewProcedure?.category}</span>
              {viewProcedure?.project && (
                <span className="text-sm text-gray-500">
                  #{viewProcedure.project.number} {viewProcedure.project.name}
                </span>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                {viewProcedure?.content}
              </pre>
            </div>
            <p className="text-xs text-gray-400">
              Created by {viewProcedure?.createdBy.firstName} {viewProcedure?.createdBy.lastName}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmProcedure} onOpenChange={() => setDeleteConfirmProcedure(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Procedure</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to delete &quot;{deleteConfirmProcedure?.title}&quot;?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteProcedure.isPending}
            >
              {deleteProcedure.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
