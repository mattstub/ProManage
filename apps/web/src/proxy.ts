import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get('refresh_token')

  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!isPublic && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && refreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}