import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'

import type { PrismaClient } from '@prisma/client'

import { errorHandler } from '../../middleware/error-handler'
import authRoutes from '../../routes/auth'

import { createMockPrisma } from './mock-prisma'
import type { MockPrisma } from './mock-prisma'

/**
 * Builds a minimal Fastify instance for testing auth routes.
 *
 * - Registers cookie + JWT plugins (required by authenticate middleware).
 * - Decorates fastify.prisma with a mock — no real DB connection.
 * - Mounts auth routes at /api/v1/auth, matching production layout.
 *
 * Returns both the app (for inject() calls) and the prisma mock (for
 * setting up return values and asserting calls).
 *
 * To test other route groups, add additional buildXxxTestApp helpers
 * following this pattern.
 */
export async function buildAuthTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })

  // Cast required: MockPrisma is a partial of PrismaClient
  app.decorate('prisma', prisma as unknown as PrismaClient)

  app.setErrorHandler(errorHandler)

  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.ready()

  return { app, prisma }
}

/**
 * Signs a JWT for use in Authorization headers during tests.
 * Uses the same secret as the test app so jwtVerify() succeeds.
 */
export function signTestToken(
  app: Awaited<ReturnType<typeof buildAuthTestApp>>['app'],
  payload: { sub: string; email: string; organizationId: string }
) {
  return app.jwt.sign(payload)
}
