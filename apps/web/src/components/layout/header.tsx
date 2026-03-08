'use client'

import { useRouter } from 'next/navigation'

import { Avatar, AvatarFallback, Badge, Button } from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import { getApiClient, resetApiClient } from '@/lib/api-client'

export function Header() {
  const { user, clearAuth } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    try {
      await getApiClient().auth.logout()
    } catch {
      // Best-effort — token revocation may fail if API is unreachable or rate-limited.
    }
    // Clear the httpOnly cookie via a Next.js route handler (same-origin).
    // This ensures the middleware stops redirecting to /dashboard even when
    // the Fastify API is unreachable and couldn't clear the cookie itself.
    await fetch('/api/auth/logout', { method: 'POST' })
    resetApiClient()
    clearAuth()
    router.push('/login')
  }

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {user?.roles[0] && (
          <Badge variant="outline">{user.roles[0]}</Badge>
        )}
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-700">
          {user ? `${user.firstName} ${user.lastName}` : ''}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
