'use client'

import { useEffect, useState } from 'react'

import {
  Badge,
  Button,
  Dialog,
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
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@promanage/ui-components'

import type { ChannelPermission, ChannelWithRelations, RoleName } from '@promanage/core'
import { CHANNEL_MANAGE_ROLES } from '@promanage/core'

import {
  useChannelPermissions,
  useDeleteChannel,
  useLeaveChannel,
  useUpdateChannel,
  useUpdateChannelPermission,
} from '@/hooks/use-channels'

const ALL_ROLES: RoleName[] = [
  'Admin',
  'ProjectManager',
  'Superintendent',
  'Foreman',
  'FieldUser',
  'OfficeAdmin',
]

interface ChannelSettingsPanelProps {
  channel: ChannelWithRelations
  currentUserRoles: RoleName[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
  onLeft: () => void
}

export function ChannelSettingsPanel({
  channel,
  currentUserRoles,
  open,
  onOpenChange,
  onDeleted,
  onLeft,
}: ChannelSettingsPanelProps) {
  const updateChannel = useUpdateChannel(channel.id)
  const deleteChannel = useDeleteChannel()
  const leaveChannel = useLeaveChannel()
  const updatePermission = useUpdateChannelPermission(channel.id)
  const { data: permissions } = useChannelPermissions(channel.id)

  const canManage =
    currentUserRoles.some((r) =>
      (CHANNEL_MANAGE_ROLES as readonly string[]).includes(r)
    ) ||
    (permissions?.some((p: any) => currentUserRoles.includes(p.role) && p.canManage) ??
      false)
  const [form, setForm] = useState({
    name: channel.name,
    description: channel.description ?? '',
    isPrivate: channel.isPrivate,
  })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [permRole, setPermRole] = useState<RoleName>('FieldUser')
  const [permValues, setPermValues] = useState({
    canRead: true,
    canWrite: true,
    canManage: false,
  })

  useEffect(() => {
    const saved = permissions?.find((p: ChannelPermission) => p.roleName === permRole)
    if (saved) {
      setPermValues({ canRead: saved.canRead, canWrite: saved.canWrite, canManage: saved.canManage })
    } else {
      setPermValues({ canRead: true, canWrite: true, canManage: false })
    }
  }, [permRole, permissions])

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateChannel.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      isPrivate: form.isPrivate,
    })
  }

  const handleSavePerm = async (e: React.FormEvent) => {
    e.preventDefault()
    await updatePermission.mutateAsync({
      roleName: permRole,
      ...permValues,
    })
  }

  const handleDelete = async () => {
    if (deleteConfirm !== channel.name) return
    await deleteChannel.mutateAsync(channel.id)
    onOpenChange(false)
    onDeleted()
  }

  const handleLeave = async () => {
    await leaveChannel.mutateAsync(channel.id)
    onOpenChange(false)
    onLeft()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle># {channel.name} Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            {canManage && <TabsTrigger value="permissions">Permissions</TabsTrigger>}
            <TabsTrigger value="members">Members</TabsTrigger>
            {canManage && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
          </TabsList>

          {/* ── General ── */}
          <TabsContent value="general">
            <form onSubmit={handleSaveGeneral} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="set-name">Channel Name</Label>
                <Input
                  id="set-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  disabled={!canManage}
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-desc">Description</Label>
                <Textarea
                  id="set-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  disabled={!canManage}
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Private channel</p>
                <Switch
                  checked={form.isPrivate}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isPrivate: v }))}
                  disabled={!canManage}
                />
              </div>
              {canManage && (
                <Button type="submit" disabled={updateChannel.isPending}>
                  {updateChannel.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form>
          </TabsContent>

          {/* ── Permissions ── */}
          {canManage && (
            <TabsContent value="permissions">
              <div className="mt-4 space-y-4">
                {/* Current permissions table */}
                {permissions && permissions.length > 0 && (
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-700 font-medium">Role</th>
                        <th className="text-center px-3 py-2 text-gray-700 font-medium">Read</th>
                        <th className="text-center px-3 py-2 text-gray-700 font-medium">Write</th>
                        <th className="text-center px-3 py-2 text-gray-700 font-medium">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((p) => (
                        <tr key={p.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-900">{p.roleName}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={p.canRead ? 'success' : 'default'}>
                              {p.canRead ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={p.canWrite ? 'success' : 'default'}>
                              {p.canWrite ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant={p.canManage ? 'success' : 'default'}>
                              {p.canManage ? 'Yes' : 'No'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Edit a role's permissions */}
                <form onSubmit={handleSavePerm} className="space-y-3 border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-900">Edit role permissions</p>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={permRole}
                      onValueChange={(v) => setPermRole(v as RoleName)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {(['canRead', 'canWrite', 'canManage'] as const).map((key) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch
                          checked={permValues[key]}
                          onCheckedChange={(v) => setPermValues((p) => ({ ...p, [key]: v }))}
                        />
                        <Label className="capitalize">{key.replace('can', '')}</Label>
                      </div>
                    ))}
                  </div>
                  <Button type="submit" size="sm" disabled={updatePermission.isPending}>
                    {updatePermission.isPending ? 'Saving...' : 'Update'}
                  </Button>
                </form>
              </div>
            </TabsContent>
          )}

          {/* ── Members ── */}
          <TabsContent value="members">
            <div className="mt-4 space-y-2">
              {channel.members && channel.members.length > 0 ? (
                channel.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                      {m.user.firstName[0]}{m.user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.user.firstName} {m.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{m.user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No members found.</p>
              )}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  disabled={leaveChannel.isPending}
                >
                  {leaveChannel.isPending ? 'Leaving...' : 'Leave Channel'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Danger Zone ── */}
          {canManage && (
            <TabsContent value="danger">
              <div className="mt-4 space-y-4">
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <p className="text-sm font-semibold text-red-800 mb-1">Delete this channel</p>
                  <p className="text-sm text-red-700 mb-3">
                    This will permanently delete the channel and all its messages. Type{' '}
                    <strong>{channel.name}</strong> to confirm.
                  </p>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={channel.name}
                    className="mb-3"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteConfirm !== channel.name || deleteChannel.isPending}
                    onClick={handleDelete}
                  >
                    {deleteChannel.isPending ? 'Deleting...' : 'Delete Channel'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
