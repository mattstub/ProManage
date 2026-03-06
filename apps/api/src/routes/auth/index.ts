import { loginSchema, registerSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
import { RATE_LIMITS } from '../../lib/rate-limit'
import * as authService from '../../services/auth.service'

import type { FastifyPluginAsync } from 'fastify'

const REFRESH_COOKIE = 'refresh_token'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Create rate limit preHandlers using fastify's rateLimit decorator
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)

  // POST /auth/register
  fastify.post(
    '/register',
    {
      config: {
        rateLimit: RATE_LIMITS.WRITE,
      },
    },
    async (request, reply) => {
      const input = registerSchema.parse(request.body)
      const result = await authService.register(fastify, input)

      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

      return success(reply, {
        user: result.user,
        accessToken: result.accessToken,
      }, 201)
    }
  )

  // POST /auth/login
  fastify.post(
    '/login',
    {
      preHandler: writeRateLimiter,
      config: {
        rateLimit: RATE_LIMITS.WRITE,
      },
    },
    async (request, reply) => {
      const input = loginSchema.parse(request.body)
      const result = await authService.login(fastify, input)

      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

      return success(reply, {
        user: result.user,
        accessToken: result.accessToken,
      })
    }
  )

  // POST /auth/refresh
  fastify.post(
    '/refresh',
    { preHandler: writeRateLimiter },
    async (request, reply) => {
      const token = (request.cookies as Record<string, string>)[REFRESH_COOKIE]

      if (!token) {
        return reply.status(401).send({
          error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
        })
      }

      const result = await authService.refresh(fastify, token)

      reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

      return success(reply, { accessToken: result.accessToken })
    }
  )

  // POST /auth/logout — intentionally unauthenticated.
  // The client may call this when the access token has already expired (e.g.
  // from onAuthError). We revoke whatever refresh token is in the cookie and
  // clear it. This is the only way to break the redirect loop caused by an
  // expired/revoked cookie that the Next.js middleware still trusts.
  fastify.post(
    '/logout',
    { preHandler: writeRateLimiter },
    async (request, reply) => {
      const token = (request.cookies as Record<string, string>)[REFRESH_COOKIE]

      if (token) {
        await authService.logout(fastify, token)
      }

      reply.clearCookie(REFRESH_COOKIE, { path: '/' })

      return reply.status(204).send()
    }
  )

  // GET /auth/me
  fastify.get(
    '/me',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const result = await authService.getMe(fastify, request.user.id)
      return success(reply, result)
    }
  )
}

export default authRoutes
