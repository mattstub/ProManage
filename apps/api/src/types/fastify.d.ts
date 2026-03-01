import 'fastify'

import type { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }

  interface FastifyRequest {
    user: {
      id: string
      email: string
      organizationId: string
    }
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      email: string
      organizationId: string
    }
    user: {
      id: string
      email: string
      organizationId: string
    }
  }
}
