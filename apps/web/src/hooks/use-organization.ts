'use client'

import { useQuery } from '@tanstack/react-query'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useOrganization() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['organization', 'current'],
    queryFn: () => getApiClient().organizations.getCurrent(),
    enabled: isAuthenticated,
  })
}
