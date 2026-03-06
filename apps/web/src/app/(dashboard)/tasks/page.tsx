'use client'

import {
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
  RoleName,
  TaskPriority,
  TaskStatus,
  TaskWithRelations,
} from '@promanage/core'
import type { BadgeProps } from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'

const STATUS_VARIANT: Record<TaskStatus, BadgeProps['variant']> = {
  OPEN: 'primary',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const PRIORITY_VARIANT: Record<TaskPriority, BadgeProps['variant']> = {
  LOW: 'default',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
}

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const STATUS_OPTIONS: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const PRIORITY_OPTIONS: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const CREATE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin']

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatUserName(user: { firstName: string; lastName: string } | null | undefined): string {
  if (!user) return '-'
  return `${user.firstName} ${user.lastName}`
}

function TasksTableSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

interface TaskFormData {
  title: string
  description: string
  priority: TaskPriority
  status?: TaskStatus
  dueDate: string
  projectId: string
  assigneeId: string
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: '',
  projectId: '',
  assigneeId: '',
}

export default function TasksPage() {
  const { user } = useAuth()
  const { data: tasksResult, isLoading } = useTasks()
  const { data: projectsResult } = useProjects()
  const { data: usersResult } = useUsers()

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null)
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<TaskWithRelations | null>(null)
  const [formData, setFormData] = useState<TaskFormData>(initialFormData)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL')
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL')

  const tasks: TaskWithRelations[] = tasksResult?.data ?? []
  const projects = projectsResult?.data ?? []
  const users = usersResult?.data ?? []

  const userRoles = user?.roles ?? []
  const canCreate = CREATE_ROLES.some((r) => userRoles.includes(r))
  const canDelete = DELETE_ROLES.some((r) => userRoles.includes(r))

  // Check if user can edit a specific task
  const canEditTask = (task: TaskWithRelations) => {
    if (CREATE_ROLES.some((r) => userRoles.includes(r))) return true
    return task.assigneeId === user?.id
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== 'ALL' && task.status !== filterStatus) return false
    if (filterAssignee !== 'ALL' && task.assigneeId !== filterAssignee) return false
    return true
  })

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setCreateOpen(true)
  }

  const handleOpenEdit = (task: TaskWithRelations) => {
    setFormData({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      projectId: task.projectId ?? '',
      assigneeId: task.assigneeId ?? '',
    })
    setEditTask(task)
  }

  const handleCloseDialogs = () => {
    setCreateOpen(false)
    setEditTask(null)
    setDeleteConfirmTask(null)
    setFormData(initialFormData)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTask.mutateAsync({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      projectId: formData.projectId || undefined,
      assigneeId: formData.assigneeId || undefined,
    })
    handleCloseDialogs()
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTask) return

    await updateTask.mutateAsync({
      id: editTask.id,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      projectId: formData.projectId || null,
      assigneeId: formData.assigneeId || null,
    })
    handleCloseDialogs()
  }

  const handleDelete = async () => {
    if (!deleteConfirmTask) return
    await deleteTask.mutateAsync(deleteConfirmTask.id)
    handleCloseDialogs()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Tasks' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Tasks</h1>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Task
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
            onValueChange={(value) => setFilterStatus(value as TaskStatus | 'ALL')}
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
          <Label htmlFor="filter-assignee" className="text-sm text-gray-600">
            Assignee:
          </Label>
          <Select
            value={filterAssignee}
            onValueChange={setFilterAssignee}
          >
            <SelectTrigger className="w-48" id="filter-assignee">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
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
              <TableHead>Priority</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TasksTableSkeleton />
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No tasks found.{' '}
                  {canCreate && (
                    <button
                      onClick={handleOpenCreate}
                      className="text-blue-600 hover:underline"
                    >
                      Create your first task.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[task.status]}>
                      {STATUS_LABEL[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>
                      {PRIORITY_LABEL[task.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {task.project ? `#${task.project.number} ${task.project.name}` : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatUserName(task.assignee)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(task.dueDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canEditTask(task) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(task)}
                          title="Edit task"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmTask(task)}
                          title="Delete task"
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

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_LABEL[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={formData.projectId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select a project" />
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
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select
                value={formData.assigneeId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="assigneeId">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createTask.isPending}>
                {createTask.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
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
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_LABEL[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-projectId">Project</Label>
              <Select
                value={formData.projectId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="edit-projectId">
                  <SelectValue placeholder="Select a project" />
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
            <div className="space-y-2">
              <Label htmlFor="edit-assigneeId">Assignee</Label>
              <Select
                value={formData.assigneeId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value === 'none' ? '' : value })}
              >
                <SelectTrigger id="edit-assigneeId">
                  <SelectValue placeholder="Select an assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={updateTask.isPending}>
                {updateTask.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmTask} onOpenChange={() => setDeleteConfirmTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to delete the task &quot;{deleteConfirmTask?.title}&quot;?
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
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
