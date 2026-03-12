'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

import { Button, Skeleton, Textarea } from '@promanage/ui-components'

import type { Channel, ChatMessageWithRelations } from '@promanage/core'

import {
  useChannelMessages,
  useChannelSocketEvents,
  useDeleteChannelMessage,
  useEditChannelMessage,
  useSendChannelMessage,
} from '@/hooks/use-channels'
import { MessageThreadPanel } from './message-thread-panel'

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface ChannelChatPanelProps {
  channel: Channel
  currentUserId: string
}

export function ChannelChatPanel({ channel, currentUserId }: ChannelChatPanelProps) {
  const { data: result, isLoading } = useChannelMessages(channel.id)
  const sendMessage = useSendChannelMessage(channel.id)
  const editMessage = useEditChannelMessage(channel.id)
  const deleteMessage = useDeleteChannelMessage(channel.id)

  useChannelSocketEvents(channel.id)

  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [threadMessage, setThreadMessage] = useState<ChatMessageWithRelations | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = (result?.data ?? []).filter((m) => !m.parentId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    await sendMessage.mutateAsync({ body: body.trim() })
    setBody('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !editBody.trim()) return
    await editMessage.mutateAsync({ messageId: editingId, body: editBody.trim() })
    setEditingId(null)
    setEditBody('')
  }

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate(messageId)
  }

  const startEdit = (msg: ChatMessageWithRelations) => {
    setEditingId(msg.id)
    setEditBody(msg.body)
    setThreadMessage(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main chat */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <p className="font-semibold text-gray-900"># {channel.name}</p>
          {channel.description && (
            <p className="text-xs text-gray-500 mt-0.5">{channel.description}</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <ChatBubbleLeftIcon className="h-10 w-10" />
              <p className="text-sm">No messages yet. Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId
              const isEditing = editingId === msg.id
              const replyCount = msg.replyCount ?? 0
              const senderFirst = msg.sender?.firstName ?? ''
              const senderLast = msg.sender?.lastName ?? ''
              const hasName = senderFirst.length > 0 || senderLast.length > 0
              const initials = hasName
                ? `${senderFirst.slice(0, 1)}${senderLast.slice(0, 1)}`.trim() || '?'
                : '?'
              const displayName = isMine
                ? 'You'
                : msg.sender
                ? `${senderFirst} ${senderLast}`.trim() || 'Unknown user'
                : 'Deleted user'

              return (
                <div
                  key={msg.id}
                  className="group flex items-start gap-3 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5 ${msg.sender ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {displayName}
                      </p>
                      <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                      {msg.editedAt && (
                        <span className="text-xs text-gray-400 italic">(edited)</span>
                      )}
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleEdit} className="mt-1 flex items-end gap-2">
                        <Textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={2}
                          className="flex-1 resize-none text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleEdit(e as unknown as React.FormEvent)
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <Button type="submit" size="sm" disabled={editMessage.isPending}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">
                          {msg.deletedAt ? (
                            <em className="text-gray-400">Message deleted</em>
                          ) : (
                            msg.body
                          )}
                        </p>
                        {replyCount > 0 && (
                          <button
                            onClick={() => setThreadMessage(msg)}
                            className="mt-1 text-xs text-blue-600 hover:underline"
                          >
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions (only on hover) */}
                  {!msg.deletedAt && !isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setThreadMessage(msg)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Reply in thread"
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                      </button>
                      {isMine && (
                        <>
                          <button
                            onClick={() => startEdit(msg)}
                            className="p-1 text-gray-400 hover:text-gray-700"
                            title="Edit message"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete message"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Message #${channel.name}`}
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as unknown as React.FormEvent)
                }
              }}
            />
            <Button
              type="submit"
              disabled={!body.trim() || sendMessage.isPending}
              className="shrink-0"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Thread panel (slide in from right) */}
      {threadMessage && (
        <MessageThreadPanel
          channelId={channel.id}
          parentMessage={threadMessage}
          currentUserId={currentUserId}
          onClose={() => setThreadMessage(null)}
        />
      )}
    </div>
  )
}
