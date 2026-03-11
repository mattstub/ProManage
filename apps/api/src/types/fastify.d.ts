import 'fastify'

import type { ServerResponse } from 'http'
import type { PrismaClient } from '@prisma/client'
import type { Server as SocketIoServer } from 'socket.io'
import type { Client as MinioClient } from 'minio'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    sseClients: Map<string, Set<ServerResponse>>
    io: SocketIoServer
    minio: MinioClient
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
