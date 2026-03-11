'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListChannelMessagesParams } from '@promanage/api-client'
import type {
  CreateChannelInput,
  SendChatMessageInput,
  UpdateChannelInput,
  UpdateChannelPermissionInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'
import { getSocket } from './use-socket'

// ─── Query Hooks ─────────────────────────────────────────────────────────────

export function useChannels() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['channels'],
    queryFn: () => getApiClient().channels.list(),
    enabled: isAuthenticated,
  })
}

export function useChannel(channelId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['channels', channelId],
    queryFn: () => getApiClient().channels.get(channelId!),
    enabled: isAuthenticated && Boolean(channelId),
  })
}

export function useChannelMessages(channelId: string | null, params?: ListChannelMessagesParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['channels', channelId, 'messages', params],
    queryFn: () => getApiClient().channels.listMessages(channelId!, params),
    enabled: isAuthenticated && Boolean(channelId),
  })
}

export function useChannelPermissions(channelId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['channels', channelId, 'permissions'],
    queryFn: () => getApiClient().channels.listPermissions(channelId!),
    enabled: isAuthenticated && Boolean(channelId),
  })
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

export function useCreateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateChannelInput) => getApiClient().channels.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannel(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateChannelInput) => getApiClient().channels.update(channelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId] })
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => getApiClient().channels.delete(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useUpdateChannelPermission(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateChannelPermissionInput) =>
      getApiClient().channels.updatePermission(channelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'permissions'] })
    },
  })
}

export function useJoinChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => getApiClient().channels.join(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useLeaveChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (channelId: string) => getApiClient().channels.leave(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useSendChannelMessage(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendChatMessageInput) =>
      getApiClient().channels.sendMessage(channelId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] })
    },
  })
}

export function useEditChannelMessage(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      getApiClient().channels.editMessage(channelId, messageId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] })
    },
  })
}

export function useDeleteChannelMessage(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) =>
      getApiClient().channels.deleteMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] })
    },
  })
}

export function useGetUploadUrl(channelId: string) {
  return useMutation({
    mutationFn: (file: { filename: string; mimeType: string; sizeBytes: number }) =>
      getApiClient().channels.getUploadUrl(channelId, file),
  })
}

export function useConfirmAttachment(channelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string
      data: { filename: string; mimeType: string; sizeBytes: number; storageKey: string }
    }) => getApiClient().channels.confirmAttachment(channelId, messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] })
    },
  })
}

// ─── Socket Events ────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time channel events and invalidate the relevant query
 * cache entries so UI updates automatically on new messages, edits, and deletes.
 */
export function useChannelSocketEvents(channelId: string | null) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!channelId || !accessToken) return

    const socket = getSocket(accessToken)

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['channels', channelId, 'messages'] })
    }

    socket.on('channel:message', invalidate)
    socket.on('channel:message:edited', invalidate)
    socket.on('channel:message:deleted', invalidate)

    return () => {
      socket.off('channel:message', invalidate)
      socket.off('channel:message:edited', invalidate)
      socket.off('channel:message:deleted', invalidate)
    }
  }, [channelId, accessToken, queryClient])
}
