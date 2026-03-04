'use client'

import { createApiClient } from '@promanage/api-client'

import { useAuthStore } from '@/stores/auth.store'

let _client: ReturnType<typeof createApiClient> | null = null

export function getApiClient() {
  if (!_client) {
    _client = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
      onTokenRefresh: (token) => {
        useAuthStore.getState().setToken(token)
      },
      onAuthError: () => {
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') {
          const publicPaths = ['/login', '/register']
          const isPublic = publicPaths.some((p) =>
            window.location.pathname.startsWith(p)
          )
          if (!isPublic) {
            window.location.href = '/login'
          }
        }
      },
    })
  }
  return _client
}

export function resetApiClient() {
  _client = null
}
