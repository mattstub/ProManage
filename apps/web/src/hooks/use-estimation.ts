'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  CreateBidResultInput,
  CreateEstimateInput,
  CreateEstimateItemInput,
  CreateEstimateItemVendorQuoteInput,
  UpdateBidResultInput,
  UpdateEstimateInput,
  UpdateEstimateItemInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Estimates ───────────────────────────────────────────────────────────────

export function useEstimates(projectId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['estimates', projectId],
    queryFn: () => getApiClient().estimation.list(projectId),
    enabled: isAuthenticated && Boolean(projectId),
  })
}

export function useEstimate(projectId: string, estimateId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['estimates', projectId, estimateId],
    queryFn: () => getApiClient().estimation.get(projectId, estimateId),
    enabled: isAuthenticated && Boolean(projectId) && Boolean(estimateId),
  })
}

export function useEstimateSummary(projectId: string, estimateId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['estimates', projectId, estimateId, 'summary'],
    queryFn: () => getApiClient().estimation.getSummary(projectId, estimateId),
    enabled: isAuthenticated && Boolean(projectId) && Boolean(estimateId),
  })
}

export function useCreateEstimate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEstimateInput) =>
      getApiClient().estimation.create(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId] })
    },
  })
}

export function useUpdateEstimate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEstimateInput & { id: string }) =>
      getApiClient().estimation.update(projectId, id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId] })
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId, variables.id] })
    },
  })
}

export function useDeleteEstimate(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (estimateId: string) =>
      getApiClient().estimation.delete(projectId, estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId] })
    },
  })
}

// ─── Items ────────────────────────────────────────────────────────────────────

export function useEstimateItems(projectId: string, estimateId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['estimate-items', projectId, estimateId],
    queryFn: () => getApiClient().estimation.listItems(projectId, estimateId),
    enabled: isAuthenticated && Boolean(projectId) && Boolean(estimateId),
  })
}

export function useCreateEstimateItem(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEstimateItemInput) =>
      getApiClient().estimation.createItem(projectId, estimateId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', projectId, estimateId] })
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId, estimateId] })
    },
  })
}

export function useUpdateEstimateItem(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEstimateItemInput & { id: string }) =>
      getApiClient().estimation.updateItem(projectId, estimateId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', projectId, estimateId] })
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId, estimateId] })
    },
  })
}

export function useDeleteEstimateItem(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) =>
      getApiClient().estimation.deleteItem(projectId, estimateId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', projectId, estimateId] })
      queryClient.invalidateQueries({ queryKey: ['estimates', projectId, estimateId] })
    },
  })
}

// ─── Vendor Quotes ────────────────────────────────────────────────────────────

export function useUpsertVendorQuote(projectId: string, estimateId: string, itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEstimateItemVendorQuoteInput) =>
      getApiClient().estimation.upsertQuote(projectId, estimateId, itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', projectId, estimateId] })
    },
  })
}

export function useDeleteVendorQuote(projectId: string, estimateId: string, itemId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (quoteId: string) =>
      getApiClient().estimation.deleteQuote(projectId, estimateId, itemId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', projectId, estimateId] })
    },
  })
}

// ─── Bid Results ──────────────────────────────────────────────────────────────

export function useBidResults(projectId: string, estimateId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['bid-results', projectId, estimateId],
    queryFn: () => getApiClient().estimation.listBidResults(projectId, estimateId),
    enabled: isAuthenticated && Boolean(projectId) && Boolean(estimateId),
  })
}

export function useCreateBidResult(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBidResultInput) =>
      getApiClient().estimation.createBidResult(projectId, estimateId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-results', projectId, estimateId] })
    },
  })
}

export function useUpdateBidResult(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateBidResultInput & { id: string }) =>
      getApiClient().estimation.updateBidResult(projectId, estimateId, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-results', projectId, estimateId] })
    },
  })
}

export function useDeleteBidResult(projectId: string, estimateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (resultId: string) =>
      getApiClient().estimation.deleteBidResult(projectId, estimateId, resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-results', projectId, estimateId] })
    },
  })
}
