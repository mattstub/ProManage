'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  CreateSubmittalDocumentInput,
  CreateSubmittalInput,
  UpdateSubmittalDocumentInput,
  UpdateSubmittalInput,
} from '@promanage/core'
import type { UseMutationResult } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Submittals ───────────────────────────────────────────────────────────────

export function useSubmittals(projectId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['submittals', projectId],
    queryFn: () => getApiClient().submittals.list({ projectId }),
    enabled: isAuthenticated && Boolean(projectId),
  })
}

export function useSubmittal(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['submittals', 'detail', id],
    queryFn: () => getApiClient().submittals.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateSubmittal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSubmittalInput) => getApiClient().submittals.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submittals', data.projectId] })
    },
  })
}

export function useUpdateSubmittal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSubmittalInput & { id: string }) =>
      getApiClient().submittals.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submittals', data.projectId] })
      queryClient.invalidateQueries({ queryKey: ['submittals', 'detail', data.id] })
    },
  })
}

export function useDeleteSubmittal(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().submittals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittals', projectId] })
    },
  })
}

// ─── Submittal Documents ──────────────────────────────────────────────────────

export function useSubmittalDocuments(submittalId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['submittal-documents', submittalId],
    queryFn: () => getApiClient().submittals.listDocuments(submittalId),
    enabled: isAuthenticated && Boolean(submittalId),
  })
}

export function useCreateSubmittalDocument(submittalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSubmittalDocumentInput) =>
      getApiClient().submittals.createDocument(submittalId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-documents', submittalId] })
    },
  })
}

export function useUpdateSubmittalDocument(submittalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSubmittalDocumentInput & { id: string }) =>
      getApiClient().submittals.updateDocument(submittalId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-documents', submittalId] })
    },
  })
}

export function useDeleteSubmittalDocument(submittalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (docId: string) => getApiClient().submittals.deleteDocument(submittalId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submittal-documents', submittalId] })
    },
  })
}

export function useSubmittalDocumentUploadUrl(
  submittalId: string
): UseMutationResult<{ url: string; fileKey: string }, Error, string> {
  return useMutation({
    mutationFn: (docId: string) =>
      getApiClient().submittals.getDocumentUploadUrl(submittalId, docId),
  })
}

export function useSubmittalDocumentDownloadUrl(submittalId: string) {
  return useMutation({
    mutationFn: (docId: string) =>
      getApiClient().submittals.getDocumentDownloadUrl(submittalId, docId),
  })
}
