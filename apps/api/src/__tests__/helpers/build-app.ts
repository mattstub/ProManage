import { vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

import type { PrismaClient } from '@prisma/client'
import type { Server as SocketIoServer } from 'socket.io'
import type { Client as MinioClient } from 'minio'

import { errorHandler } from '../../middleware/error-handler'
import authRoutes from '../../routes/auth'
import calendarEventRoutes from '../../routes/calendar-events'
import channelRoutes from '../../routes/channels'
import contactRoutes from '../../routes/contacts'
import messageRoutes from '../../routes/messages'
import notificationRoutes from '../../routes/notifications'
import taskRoutes from '../../routes/tasks'

import { createMockPrisma } from './mock-prisma'
import type { MockPrisma } from './mock-prisma'

/**
 * Creates a mock Socket.io server for use in test apps.
 * Tests can assert emit calls via the returned mock.
 */
function createMockIo() {
  const emit = vi.fn()
  const to = vi.fn().mockReturnValue({ emit })
  return { to, emit } as unknown as SocketIoServer
}

/**
 * Creates a mock MinIO client for use in test apps.
 */
function createMockMinio() {
  return {
    presignedPutObject: vi.fn().mockResolvedValue('https://minio.local/presigned-put'),
    presignedGetObject: vi.fn().mockResolvedValue('https://minio.local/presigned-get'),
    bucketExists: vi.fn().mockResolvedValue(true),
    putObject: vi.fn().mockResolvedValue(undefined),
    statObject: vi.fn().mockResolvedValue({}),
  } as unknown as MinioClient
}

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
 * Builds a minimal Fastify instance for testing channel routes.
 *
 * Decorates fastify.io with a mock Socket.io server and fastify.minio
 * with a mock MinIO client so tests can assert real-time event emission
 * and attachment URL generation without live connections.
 */
export async function buildChannelTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()
  const io = createMockIo()
  const minio = createMockMinio()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  app.decorate('prisma', prisma as unknown as PrismaClient)
  app.decorate('io', io)
  app.decorate('minio', minio)
  // SSE clients decorator required by authenticate middleware
  app.decorate('sseClients', new Map())

  app.setErrorHandler(errorHandler)

  await app.register(channelRoutes, { prefix: '/api/v1/channels' })
  await app.ready()

  return { app, prisma, io, minio }
}

/**
 * Builds a minimal Fastify instance for testing contact routes.
 */
export async function buildContactTestApp(overridePrisma?: MockPrisma) {
  const prisma = overridePrisma ?? createMockPrisma()

  const app = Fastify({ logger: false })

  await app.register(cookie)
  await app.register(jwt, { secret: process.env['JWT_SECRET']! })
  await app.register(rateLimit, { max: 1000, timeWindow: '1 minute' })

  // Cast required: MockPrisma is a partial of PrismaClient
  app.decorate('prisma', prisma as unknown as PrismaClient)

  app.setErrorHandler(errorHandler)

  await app.register(contactRoutes, { prefix: '/api/v1/contacts' })
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
