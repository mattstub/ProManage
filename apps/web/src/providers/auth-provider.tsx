'use client'

import { useEffect } from 'react'

import { ApiClientError } from '@promanage/api-client'
import { Skeleton } from '@promanage/ui-components'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, setAuth, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    const client = getApiClient()
    client.auth
      .me()
      .then((user) => {
        const token = client.core.getAccessToken() ?? ''
        setAuth(user, token)
      })
      .catch((err: unknown) => {
        if (
          err instanceof ApiClientError &&
          (err.isUnauthorized || err.isForbidden)
        ) {
          clearAuth()
        } else {
          // Network or server error — do not clear auth, just unblock UI
          setLoading(false)
        }
      })
  }, [setAuth, clearAuth, setLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
