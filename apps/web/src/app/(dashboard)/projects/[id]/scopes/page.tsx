'use client'

import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { PROJECT_SCOPE_STATUSES, type ProjectScopeStatus, type RoleName } from '@promanage/core'
import {
  Badge,
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
  type BadgeProps,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import {
  useCreateProjectScope,
  useDeleteProjectScope,
  useProjectScopes,
  useUpdateProjectScope,
} from '@/hooks/use-projects'

import type { ProjectScope } from '@promanage/api-client'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager']

const SCOPE_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  Active: 'success',
  Pending: 'primary',
  Complete: 'default',
  OnHold: 'warning',
}

function ScopeFormDialog({
  projectId,
  scope,
  open,
  onOpenChange,
}: {
  projectId: string
  scope?: ProjectScope
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createScope = useCreateProjectScope()
  const updateScope = useUpdateProjectScope()
  const [name, setName] = useState(scope?.name ?? '')
  const [description, setDescription] = useState(scope?.description ?? '')
  const [status, setStatus] = useState<ProjectScopeStatus>(
    (scope?.status as ProjectScopeStatus) ?? 'Active'
  )
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(scope)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      if (isEditing && scope) {
        await updateScope.mutateAsync({
          projectId,
          scopeId: scope.id,
          input: { name, description: description || undefined, status },
        })
      } else {
        await createScope.mutateAsync({
          projectId,
          input: { name, description: description || undefined, status, sequence: 0 },
        })
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save scope'
      setError(msg)
    }
  }

  const isPending = createScope.isPending || updateScope.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Scope' : 'Add Scope'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="scope-name">Name *</Label>
            <Input
              id="scope-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scope-desc">Description</Label>
            <Input
              id="scope-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scope-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectScopeStatus)}>
              <SelectTrigger id="scope-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROJECT_SCOPE_STATUSES).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Scope'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectScopesPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const { data: scopes, isLoading } = useProjectScopes(params.id)
  const deleteScope = useDeleteProjectScope()
  const [addOpen, setAddOpen] = useState(false)
  const [editScope, setEditScope] = useState<ProjectScope | null>(null)

  const canManage = WRITE_ROLES.some((r) => user?.roles.includes(r))

  async function handleDelete(scopeId: string) {
    await deleteScope.mutateAsync({ projectId: params.id, scopeId })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Project Scopes</h2>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Scope
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (scopes?.length ?? 0) === 0 ? (
        <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No scopes defined yet.{' '}
          {canManage && (
            <button onClick={() => setAddOpen(true)} className="text-blue-600 hover:underline">
              Add the first scope.
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {scopes?.map((scope) => (
            <div
              key={scope.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{scope.name}</span>
                  <Badge variant={SCOPE_STATUS_VARIANT[scope.status] ?? 'default'}>
                    {scope.status}
                  </Badge>
                </div>
                {scope.description && (
                  <p className="text-sm text-gray-500">{scope.description}</p>
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditScope(scope)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded"
                    title="Edit"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(scope.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ScopeFormDialog
        projectId={params.id}
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      {editScope && (
        <ScopeFormDialog
          projectId={params.id}
          scope={editScope}
          open={Boolean(editScope)}
          onOpenChange={(open) => { if (!open) setEditScope(null) }}
        />
      )}
    </div>
  )
}
