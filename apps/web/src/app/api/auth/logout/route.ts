import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 *
 * Clears the refresh_token cookie from the Next.js origin (localhost:3000).
 * This is needed because the cookie is set by the Fastify API (localhost:3001)
 * on the shared 'localhost' domain, and both origins can clear it via
 * Set-Cookie. Calling this guarantees the middleware stops redirecting the
 * user back to /dashboard even if the Fastify logout endpoint is unreachable.
 */
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return response
}
