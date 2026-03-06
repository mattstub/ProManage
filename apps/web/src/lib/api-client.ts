'use client'

import { createApiClient } from '@promanage/api-client'

import { useAuthStore } from '@/stores/auth.store'

let _client: ReturnType<typeof createApiClient> | null = null

export function getApiClient() {
  if (!_client) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

    _client = createApiClient({
      baseUrl,
      onTokenRefresh: (token) => {
        useAuthStore.getState().setToken(token)
      },
      onAuthError: () => {
        useAuthStore.getState().clearAuth()
        resetApiClient()

        if (typeof window !== 'undefined') {
          const publicPaths = ['/login', '/register']
          const isPublic = publicPaths.some((p) =>
            window.location.pathname.startsWith(p)
          )
          if (!isPublic) {
            // Call logout to revoke the httpOnly refresh-token cookie server-side
            // before redirecting. Without this, the Next.js middleware still sees
            // the cookie and redirects back to /dashboard — causing an infinite loop.
            // keepalive ensures the request completes even as the page navigates.
            fetch(`${baseUrl}/api/v1/auth/logout`, {
              method: 'POST',
              credentials: 'include',
              keepalive: true,
            }).finally(() => {
              window.location.href = '/login'
            })
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
