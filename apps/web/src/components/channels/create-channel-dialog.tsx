'use client'

import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@promanage/ui-components'

import { useCreateChannel } from '@/hooks/use-channels'

interface CreateChannelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChannelDialog({ open, onOpenChange }: CreateChannelDialogProps) {
  const createChannel = useCreateChannel()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    isPrivate: false,
  })

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
    await createChannel.mutateAsync({
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      isPrivate: form.isPrivate,
    })
    onOpenChange(false)
    setForm({ name: '', slug: '', description: '', isPrivate: false })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="ch-name">Channel Name *</Label>
            <Input
              id="ch-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. general"
              maxLength={80}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-slug">Slug *</Label>
            <Input
              id="ch-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              placeholder="e.g. general"
              pattern="^[a-z0-9-]+$"
              required
            />
            <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ch-desc">Description</Label>
            <Textarea
              id="ch-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What's this channel about?"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Private channel</p>
              <p className="text-xs text-gray-500">Only members you invite can see this channel.</p>
            </div>
            <Switch
              checked={form.isPrivate}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isPrivate: v }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!form.name || !form.slug || createChannel.isPending}>
              {createChannel.isPending ? 'Creating...' : 'Create Channel'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
