import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

import type { PrismaClient } from '@prisma/client'

import { errorHandler } from '../../middleware/error-handler'
import authRoutes from '../../routes/auth'
import calendarEventRoutes from '../../routes/calendar-events'
import messageRoutes from '../../routes/messages'
import notificationRoutes from '../../routes/notifications'
import taskRoutes from '../../routes/tasks'

import { createMockPrisma } from './mock-prisma'
import type { MockPrisma } from './mock-prisma'

/**
 * Builds a minimal Fastify instance for testing auth routes.
 *
 * - Registers cookie + JWT + rate-limit plugins (required by routes).
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
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

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
  payload: { sub: string; email: string; organizationId: string; roles?: string[] }
) {
  return app.jwt.sign(payload)
}

/**
 * Builds a minimal Fastify instance for testing task routes.
 *
 * - Registers cookie + JWT + rate-limit plugins (required by routes).
 * - Decorates fastify.prisma with a mock — no real DB connection.
 * - Mounts task routes at /api/v1/tasks, matching production layout.
 *
 * Returns both the app (for inject() calls) and the prisma mock (for
 * setting up return values and asserting calls).
 */
export async function buildTaskTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  // Cast required: MockPrisma is a partial of PrismaClient
  app.decorate('prisma', prisma as unknown as PrismaClient)

  app.setErrorHandler(errorHandler)

  await app.register(taskRoutes, { prefix: '/api/v1/tasks' })
  await app.ready()

  return { app, prisma }
}

/**
 * Builds a minimal Fastify instance for testing calendar event routes.
 */
export async function buildCalendarEventTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  // Cast required: MockPrisma is a partial of PrismaClient
  app.decorate('prisma', prisma as unknown as PrismaClient)

  app.setErrorHandler(errorHandler)

  await app.register(calendarEventRoutes, { prefix: '/api/v1/calendar-events' })
  await app.ready()

  return { app, prisma }
}

/**
 * Builds a minimal Fastify instance for testing messaging routes.
 */
export async function buildMessagingTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  app.decorate('prisma', prisma as unknown as PrismaClient)

  app.setErrorHandler(errorHandler)

  await app.register(messageRoutes, { prefix: '/api/v1/messages' })
  await app.ready()

  return { app, prisma }
}

/**
 * Builds a minimal Fastify instance for testing notification routes.
 */
export async function buildNotificationTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  // Cast required: MockPrisma is a partial of PrismaClient
  app.decorate('prisma', prisma as unknown as PrismaClient)
  // SSE plugin decoration (no-op map for tests)
  app.decorate('sseClients', new Map())

  app.setErrorHandler(errorHandler)

  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' })
  await app.ready()

  return { app, prisma }
}
