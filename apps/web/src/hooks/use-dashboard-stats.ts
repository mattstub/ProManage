'use client'

import { useQuery } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useDashboardStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => getApiClient().dashboard.getStats(),
    enabled: isAuthenticated,
  })
}
