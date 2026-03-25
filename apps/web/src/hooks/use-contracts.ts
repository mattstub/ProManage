'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  CreateContractDocumentInput,
  CreateContractInput,
  UpdateContractDocumentInput,
  UpdateContractInput,
} from '@promanage/core'
import type { UseMutationResult } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Contracts ───────────────────────────────────────────────────────────────

export function useContracts(projectId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => getApiClient().contracts.list({ projectId }),
    enabled: isAuthenticated && Boolean(projectId),
  })
}

export function useContract(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['contracts', 'detail', id],
    queryFn: () => getApiClient().contracts.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContractInput) => getApiClient().contracts.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', data.projectId] })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateContractInput & { id: string }) =>
      getApiClient().contracts.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', data.projectId] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', data.id] })
    },
  })
}

export function useDeleteContract(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().contracts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] })
    },
  })
}

// ─── Contract Documents ───────────────────────────────────────────────────────

export function useContractDocuments(contractId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: () => getApiClient().contracts.listDocuments(contractId),
    enabled: isAuthenticated && Boolean(contractId),
  })
}

export function useCreateContractDocument(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContractDocumentInput) =>
      getApiClient().contracts.createDocument(contractId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', contractId] })
    },
  })
}

export function useUpdateContractDocument(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateContractDocumentInput & { id: string }) =>
      getApiClient().contracts.updateDocument(contractId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', contractId] })
    },
  })
}

export function useDeleteContractDocument(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (docId: string) => getApiClient().contracts.deleteDocument(contractId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', contractId] })
    },
  })
}

export function useContractDocumentUploadUrl(contractId: string): UseMutationResult<{ url: string; fileKey: string }, Error, string> {
  return useMutation({
    mutationFn: (docId: string) => getApiClient().contracts.getDocumentUploadUrl(contractId, docId),
  })
}

export function useContractDocumentDownloadUrl(contractId: string) {
  return useMutation({
    mutationFn: (docId: string) =>
      getApiClient().contracts.getDocumentDownloadUrl(contractId, docId),
  })
}
