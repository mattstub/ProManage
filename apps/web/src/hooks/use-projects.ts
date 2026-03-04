'use client'

import { useQuery } from '@tanstack/react-query'

import type { ListProjectsParams } from '@promanage/api-client'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useProjects(params?: ListProjectsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getApiClient().projects.list(params),
    enabled: isAuthenticated,
  })
}

export function useProject(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => getApiClient().projects.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}
