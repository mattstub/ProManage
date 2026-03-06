'use client'

import { useQuery } from '@tanstack/react-query'

import type { PaginationParams } from '@promanage/api-client'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useUsers(params?: PaginationParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getApiClient().users.list(params),
    enabled: isAuthenticated,
  })
}
