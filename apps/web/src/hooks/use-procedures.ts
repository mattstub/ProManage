'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListProceduresParams } from '@promanage/api-client'
import type { CreateProcedureInput, UpdateProcedureInput } from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useProcedures(params?: ListProceduresParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['procedures', params],
    queryFn: () => getApiClient().procedures.list(params),
    enabled: isAuthenticated,
  })
}

export function useProcedure(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['procedures', id],
    queryFn: () => getApiClient().procedures.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProcedureInput) => getApiClient().procedures.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}

export function useUpdateProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProcedureInput & { id: string }) =>
      getApiClient().procedures.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
      queryClient.invalidateQueries({ queryKey: ['procedures', variables.id] })
    },
  })
}

export function useDeleteProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().procedures.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}
