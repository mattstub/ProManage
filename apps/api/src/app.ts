import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import Fastify from 'fastify'

import { config } from './config'
import { errorHandler } from './middleware/error-handler'
import minioPlugin from './plugins/minio'
import prismaPlugin from './plugins/prisma'
import socketIoPlugin from './plugins/socket-io'
import ssePlugin from './plugins/sse'
import swaggerPlugin from './plugins/swagger'
import routes from './routes'
import healthRoutes from './routes/health'

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      ...(config.LOG_PRETTY
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    },
  })

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
  })
  await app.register(cors, {
    origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  })
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  })

  // Cookie and JWT
  await app.register(cookie)
  await app.register(jwt, {
    secret: config.JWT_SECRET,
  })

  // Plugins
  await app.register(prismaPlugin)
  await app.register(ssePlugin)
  await app.register(minioPlugin)
  await app.register(socketIoPlugin)
  await app.register(swaggerPlugin)

  // Error handler
  app.setErrorHandler(errorHandler)

  // Routes
  await app.register(healthRoutes)
  await app.register(routes, { prefix: '/api/v1' })

  return app
}
