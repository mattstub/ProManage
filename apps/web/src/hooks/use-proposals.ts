'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListProposalsParams } from '@promanage/api-client'
import type {
  CreateProposalInput,
  CreateProposalTemplateInput,
  UpdateProposalInput,
  UpdateProposalTemplateInput,
  UpsertProposalLineItemsInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Proposals ───────────────────────────────────────────────────────────────

export function useProposals(params?: ListProposalsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['proposals', params],
    queryFn: () => getApiClient().proposals.list(params),
    enabled: isAuthenticated,
  })
}

export function useProposal(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['proposals', id],
    queryFn: () => getApiClient().proposals.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProposalInput) => getApiClient().proposals.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

export function useUpdateProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProposalInput & { id: string }) =>
      getApiClient().proposals.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposals', variables.id] })
    },
  })
}

export function useDeleteProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().proposals.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

export function useUpsertProposalLineItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpsertProposalLineItemsInput & { id: string }) =>
      getApiClient().proposals.upsertLineItems(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', variables.id] })
    },
  })
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function useProposalTemplates(activeOnly = false) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['proposal-templates', { activeOnly }],
    queryFn: () => getApiClient().proposals.listTemplates(activeOnly),
    enabled: isAuthenticated,
  })
}

export function useCreateProposalTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProposalTemplateInput) =>
      getApiClient().proposals.createTemplate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}

export function useUpdateProposalTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProposalTemplateInput & { id: string }) =>
      getApiClient().proposals.updateTemplate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}

export function useDeleteProposalTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().proposals.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}
