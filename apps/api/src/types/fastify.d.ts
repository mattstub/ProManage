import 'fastify'

import type { ServerResponse } from 'http'
import type { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    sseClients: Map<string, Set<ServerResponse>>
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
