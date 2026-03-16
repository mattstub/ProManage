'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { ListNotificationsParams } from '@promanage/api-client'
import type { Notification } from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

const QUERY_KEY = 'notifications'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useNotifications(params?: ListNotificationsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => getApiClient().notifications.list(params),
    enabled: isAuthenticated,
  })
}

/**
 * Opens an SSE connection to the notifications stream.
 * Invalidates the notifications query whenever a push event arrives.
 * Call once at a high level in the layout (e.g., header).
 */
export function useSSENotifications() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return

    const url = `${API_URL}/api/v1/notifications/stream?token=${encodeURIComponent(accessToken)}`
    const es = new EventSource(url)

    es.addEventListener('notification', () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    })

    es.onerror = () => {
      // EventSource auto-reconnects on transient errors — close only on auth failure
      es.close()
    }

    return () => es.close()
  }, [accessToken, isAuthenticated, queryClient])
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().notifications.markRead(id),
    onMutate: (id) => {
      queryClient.setQueriesData<{ data: Notification[] }>(
        { queryKey: [QUERY_KEY] },
        (old) => {
          if (!old) return old
          return { ...old, data: old.data.map((n) => (n.id === id ? { ...n, read: true } : n)) }
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getApiClient().notifications.markAllRead(),
    onMutate: () => {
      queryClient.setQueriesData<{ data: Notification[] }>(
        { queryKey: [QUERY_KEY] },
        (old) => {
          if (!old) return old
          return { ...old, data: old.data.map((n) => ({ ...n, read: true })) }
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().notifications.delete(id),
    onMutate: (id) => {
      queryClient.setQueriesData<{ data: Notification[] }>(
        { queryKey: [QUERY_KEY] },
        (old) => {
          if (!old) return old
          return { ...old, data: old.data.filter((n) => n.id !== id) }
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
