'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListMaterialsParams } from '@promanage/api-client'
import type {
  CreateCostCodeInput,
  CreateMaterialInput,
  UpdateCostCodeInput,
  UpdateMaterialInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Cost Codes ──────────────────────────────────────────────────────────────

export function useCostCodes(params?: { search?: string; isActive?: boolean }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['cost-codes', params],
    queryFn: () => getApiClient().materials.listCostCodes(params),
    enabled: isAuthenticated,
  })
}

export function useCreateCostCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCostCodeInput) => getApiClient().materials.createCostCode(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] })
    },
  })
}

export function useUpdateCostCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCostCodeInput & { id: string }) =>
      getApiClient().materials.updateCostCode(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] })
    },
  })
}

export function useDeleteCostCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().materials.deleteCostCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] })
    },
  })
}

// ─── Materials ────────────────────────────────────────────────────────────────

export function useMaterials(params?: ListMaterialsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['materials', params],
    queryFn: () => getApiClient().materials.listMaterials(params),
    enabled: isAuthenticated,
  })
}

export function useMaterial(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => getApiClient().materials.getMaterial(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMaterialInput) => getApiClient().materials.createMaterial(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMaterialInput & { id: string }) =>
      getApiClient().materials.updateMaterial(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['materials', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['material-price-history', variables.id] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().materials.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useMaterialPriceHistory(materialId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['material-price-history', materialId],
    queryFn: () => getApiClient().materials.getMaterialPriceHistory(materialId),
    enabled: isAuthenticated && Boolean(materialId),
  })
}
