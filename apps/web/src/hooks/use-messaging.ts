'use client'

import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { ListAnnouncementsParams, ListConversationsParams, ListMessagesParams } from '@promanage/api-client'
import type {
  AnnouncementWithRelations,
  ConversationWithRelations,
  CreateAnnouncementInput,
  SendDirectMessageInput,
  UnreadCount,
  UpdateAnnouncementInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messaging', 'unread-count'],
    queryFn: () => getApiClient().messaging.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })
}

export function useConversations(params?: ListConversationsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messaging', 'conversations', params],
    queryFn: () => getApiClient().messaging.listConversations(params),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })
}

/**
 * Returns a callback to call when a conversation is selected.
 * Optimistically zeros out that conversation's unread count in the cache.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient()

  return useCallback((conv: ConversationWithRelations) => {
    if (!conv.unreadCount) return

    queryClient.setQueriesData<{ data: ConversationWithRelations[] }>(
      { queryKey: ['messaging', 'conversations'] },
      (old) => {
        if (!old) return old
        return { ...old, data: old.data.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c) }
      },
    )
    queryClient.setQueryData<UnreadCount>(
      ['messaging', 'unread-count'],
      (old) => {
        if (!old) return old
        const dm = Math.max(0, old.directMessages - conv.unreadCount)
        return { ...old, directMessages: dm, total: Math.max(0, old.total - conv.unreadCount) }
      },
    )
  }, [queryClient])
}

export function useConversationMessages(conversationId: string | null, params?: ListMessagesParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messaging', 'messages', conversationId, params],
    queryFn: () => getApiClient().messaging.listMessages(conversationId!, params),
    enabled: isAuthenticated && Boolean(conversationId),
    refetchInterval: 15_000,
  })
}

export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: SendDirectMessageInput }) =>
      getApiClient().messaging.startConversation(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    },
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: SendDirectMessageInput) =>
      getApiClient().messaging.sendMessage(conversationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
      // Do NOT invalidate unread-count here — sending a message cannot increase the
      // sender's unread count, and an early refetch races with the server-side
      // mark-as-read that happens when getConversationMessages runs.
    },
  })
}

export function useAnnouncements(params?: ListAnnouncementsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messaging', 'announcements', params],
    queryFn: () => getApiClient().messaging.listAnnouncements(params),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  })
}

export function useDraftAnnouncements() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['messaging', 'announcements', 'drafts'],
    queryFn: () => getApiClient().messaging.listDrafts(),
    enabled: isAuthenticated,
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAnnouncementInput) =>
      getApiClient().messaging.createAnnouncement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'announcements'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateAnnouncementInput & { id: string }) =>
      getApiClient().messaging.updateAnnouncement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'announcements'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().messaging.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'announcements'] })
    },
  })
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().messaging.markAnnouncementRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['messaging', 'announcements'] })
      await queryClient.cancelQueries({ queryKey: ['messaging', 'unread-count'] })

      // Snapshot previous values for rollback
      const previousAnnouncements = queryClient.getQueriesData<{ data: AnnouncementWithRelations[] }>(
        { queryKey: ['messaging', 'announcements'] },
      )
      const previousUnreadCount = queryClient.getQueryData<UnreadCount>(['messaging', 'unread-count'])

      // Optimistically mark as read — detect whether it was actually unread from the snapshot
      let wasUnread = false
      previousAnnouncements.forEach(([, data]) => {
        if (!data || !Array.isArray(data.data)) return
        const ann = data.data.find((a) => a.id === id)
        if (ann && !ann.isRead) wasUnread = true
      })

      queryClient.setQueriesData<{ data: AnnouncementWithRelations[] }>(
        { queryKey: ['messaging', 'announcements'] },
        (old) => {
          // Guard against the drafts query which has a different shape (Announcement[] not { data: ... })
          if (!old || !Array.isArray(old.data)) return old
          return {
            ...old,
            data: old.data.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
          }
        },
      )
      if (wasUnread) {
        queryClient.setQueryData<UnreadCount>(
          ['messaging', 'unread-count'],
          (old) => {
            if (!old) return old
            const announcements = Math.max(0, old.announcements - 1)
            return { ...old, announcements, total: Math.max(0, old.total - 1) }
          },
        )
      }
      return { previousAnnouncements, previousUnreadCount }
    },
    onError: (_err, _id, context) => {
      context?.previousAnnouncements.forEach(([key, value]) => queryClient.setQueryData(key as QueryKey, value))
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(['messaging', 'unread-count'], context.previousUnreadCount)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'announcements'] })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-count'] })
    },
  })
}
