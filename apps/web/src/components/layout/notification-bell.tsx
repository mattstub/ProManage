'use client'

import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@promanage/ui-components'

import type { Notification } from '@promanage/core'

import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useSSENotifications,
} from '@/hooks/use-notifications'

function formatRelative(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
        notification.read ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {!notification.read ? (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelative(notification.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Mark as read"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { data } = useNotifications({ perPage: 20 })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotification = useDeleteNotification()

  // Start SSE connection for real-time updates
  useSSENotifications()

  const notifications: Notification[] = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-blue-600 hover:text-blue-700 h-auto py-0.5 px-2"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onDelete={(id) => deleteNotification.mutate(id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
