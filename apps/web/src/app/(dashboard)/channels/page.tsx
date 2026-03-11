'use client'

import { useState } from 'react'
import { Cog6ToothIcon, HashtagIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline'

import { Badge, Breadcrumbs, Button, Skeleton } from '@promanage/ui-components'

import type { Channel, ChannelWithRelations, RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import { useChannels, useJoinChannel } from '@/hooks/use-channels'
import { ChannelChatPanel } from '@/components/channels/channel-chat-panel'
import { ChannelSettingsPanel } from '@/components/channels/channel-settings-panel'
import { CreateChannelDialog } from '@/components/channels/create-channel-dialog'

const MANAGE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']

export default function ChannelsPage() {
  const { user } = useAuth()
  const userRoles = (user?.roles ?? []) as RoleName[]
  const canCreate = userRoles.some((r) => MANAGE_ROLES.includes(r))

  const { data: channels, isLoading } = useChannels()
  const joinChannel = useJoinChannel()

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [settingsChannel, setSettingsChannel] = useState<ChannelWithRelations | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const channelList = channels ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Channels' }]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Channels</h1>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Channel
          </Button>
        )}
      </div>

      <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white h-[calc(100vh-180px)] min-h-[500px]">
        {/* ── Channel List ── */}
        <div className="w-60 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Channels</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : channelList.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                <HashtagIcon className="h-8 w-8 mx-auto mb-2" />
                <p>No channels yet.</p>
                {canCreate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    Create one
                  </Button>
                )}
              </div>
            ) : (
              channelList.map((ch) => {
                const isSelected = selectedChannel?.id === ch.id
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm rounded-md mx-1 my-0.5 hover:bg-gray-100 transition-colors ${
                      isSelected ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {ch.isPrivate ? (
                      <LockClosedIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <HashtagIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                    <span className="truncate">{ch.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        {selectedChannel && user ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Channel toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {selectedChannel.isPrivate ? (
                  <LockClosedIcon className="h-4 w-4" />
                ) : (
                  <HashtagIcon className="h-4 w-4" />
                )}
                <span className="font-medium text-gray-900">{selectedChannel.name}</span>
                {selectedChannel.isPrivate && (
                  <Badge variant="default" className="text-xs">Private</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => joinChannel.mutate(selectedChannel.id)}
                  disabled={joinChannel.isPending}
                  title="Join channel"
                >
                  Join
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsChannel(selectedChannel as ChannelWithRelations)}
                  title="Channel settings"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ChannelChatPanel
              channel={selectedChannel}
              currentUserId={user.id}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <HashtagIcon className="h-12 w-12" />
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {/* Create Channel Dialog */}
      <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Settings Panel */}
      {settingsChannel && (
        <ChannelSettingsPanel
          channel={settingsChannel}
          currentUserRoles={userRoles}
          open={Boolean(settingsChannel)}
          onOpenChange={(open) => {
            if (!open) setSettingsChannel(null)
          }}
          onDeleted={() => setSelectedChannel(null)}
          onLeft={() => setSelectedChannel(null)}
        />
      )}
    </div>
  )
}
