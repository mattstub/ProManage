'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListAnnouncementsParams, ListConversationsParams, ListMessagesParams } from '@promanage/api-client'
import type { CreateAnnouncementInput, SendDirectMessageInput, UpdateAnnouncementInput } from '@promanage/core'

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
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-count'] })
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
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-count'] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messaging', 'announcements'] })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-count'] })
    },
  })
}
