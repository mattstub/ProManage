'use client'

import { HashtagIcon, LockClosedIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { use, useState } from 'react'

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
  Skeleton,
  Switch,
  Textarea,
} from '@promanage/ui-components'

import type { RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import {
  useCreateChannel,
  useDeleteChannel,
  useProjectChannels,
} from '@/hooks/use-channels'

const MANAGE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']

function CreateProjectChannelDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createChannel = useCreateChannel()
  const [form, setForm] = useState({ name: '', slug: '', description: '', isPrivate: false })
  const [error, setError] = useState<string | null>(null)

  const slugify = (v: string) =>
    v
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createChannel.mutateAsync({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        isPrivate: form.isPrivate,
        projectId,
      })
      onOpenChange(false)
      setForm({ name: '', slug: '', description: '', isPrivate: false })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create channel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pch-name">Channel Name *</Label>
            <Input
              id="pch-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. project-updates"
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pch-slug">Slug *</Label>
            <Input
              id="pch-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="e.g. project-updates"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pch-desc">Description</Label>
            <Textarea
              id="pch-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What's this channel for?"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Private channel</p>
              <p className="text-xs text-gray-500">Only invited members can see this channel.</p>
            </div>
            <Switch
              checked={form.isPrivate}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPrivate: v }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!form.name || !form.slug || createChannel.isPending}>
              {createChannel.isPending ? 'Creating…' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectChannelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const userRoles = (user?.roles ?? []) as RoleName[]
  const canManage = userRoles.some((r) => MANAGE_ROLES.includes(r))

  const { data: channels, isLoading } = useProjectChannels(id)
  const deleteChannel = useDeleteChannel()
  const [createOpen, setCreateOpen] = useState(false)

  const channelList = channels ?? []

  async function handleDelete(channelId: string) {
    if (!confirm('Delete this channel? All messages will be permanently removed.')) return
    await deleteChannel.mutateAsync(channelId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Project Channels</h2>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Channel
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : channelList.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <HashtagIcon className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-900">No channels yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create a channel to keep project communication organized.
          </p>
          {canManage && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create First Channel
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {channelList.map((ch) => (
            <div
              key={ch.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                {ch.isPrivate ? (
                  <LockClosedIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <HashtagIcon className="h-5 w-5 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{ch.name}</span>
                  {ch.isPrivate && (
                    <Badge variant="outline" className="text-xs">Private</Badge>
                  )}
                </div>
                {ch.description && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{ch.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">/{ch.slug}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/channels?id=${ch.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Open
                </Link>
                {canManage && (
                  <button
                    onClick={() => handleDelete(ch.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                    title="Delete channel"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectChannelDialog
        projectId={id}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
