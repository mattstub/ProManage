import { loginSchema, registerSchema } from '@promanage/core'

import { authenticate } from '../../middleware/authenticate'
import { success } from '../../lib/response'
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
  // POST /auth/register
  fastify.post('/register', async (request, reply) => {
    const input = registerSchema.parse(request.body)
    const result = await authService.register(fastify, input)

    reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

    return success(reply, {
      user: result.user,
      accessToken: result.accessToken,
    }, 201)
  })

  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const input = loginSchema.parse(request.body)
    const result = await authService.login(fastify, input)

    reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

    return success(reply, {
      user: result.user,
      accessToken: result.accessToken,
    })
  })

  // POST /auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const token = (request.cookies as Record<string, string>)[REFRESH_COOKIE]

    if (!token) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      })
    }

    const result = await authService.refresh(fastify, token)

    reply.setCookie(REFRESH_COOKIE, result.refreshToken, cookieOptions)

    return success(reply, { accessToken: result.accessToken })
  })

  // POST /auth/logout
  fastify.post(
    '/logout',
    { preHandler: [authenticate] },
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
    { preHandler: [authenticate] },
    async (request, reply) => {
      const result = await authService.getMe(fastify, request.user.id)
      return success(reply, result)
    }
  )
}

export default authRoutes
