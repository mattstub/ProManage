'use client'

import { useState } from 'react'
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'

import { Button, Skeleton, Textarea } from '@promanage/ui-components'

import type { ChatMessageWithRelations } from '@promanage/core'

import { useChannelMessages, useSendChannelMessage } from '@/hooks/use-channels'

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface MessageThreadPanelProps {
  channelId: string
  parentMessage: ChatMessageWithRelations
  currentUserId: string
  onClose: () => void
}

export function MessageThreadPanel({
  channelId,
  parentMessage,
  currentUserId,
  onClose,
}: MessageThreadPanelProps) {
  const { data: result, isLoading } = useChannelMessages(channelId, {
    parentId: parentMessage.id,
  })
  const sendMessage = useSendChannelMessage(channelId)
  const [body, setBody] = useState('')

  const replies = result?.data ?? []

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    await sendMessage.mutateAsync({ body: body.trim(), parentId: parentMessage.id })
    setBody('')
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <p className="font-semibold text-gray-900 text-sm">Thread</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Parent message */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
            {parentMessage.sender.firstName[0]}{parentMessage.sender.lastName[0]}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">
              {parentMessage.sender.firstName} {parentMessage.sender.lastName}
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{parentMessage.body}</p>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : replies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">No replies yet.</p>
        ) : (
          replies.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-xs shrink-0">
                  {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className="text-xs font-medium text-gray-900">
                      {isMine ? 'You' : `${msg.sender.firstName} ${msg.sender.lastName}`}
                    </p>
                    <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">
                    {msg.deletedAt ? (
                      <em className="text-gray-400">Message deleted</em>
                    ) : (
                      msg.body
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Reply compose */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply in thread..."
            rows={2}
            className="flex-1 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
          />
          <Button type="submit" size="sm" disabled={!body.trim() || sendMessage.isPending}>
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
