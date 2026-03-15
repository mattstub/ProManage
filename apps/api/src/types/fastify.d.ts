import 'fastify'

import type { PrismaClient } from '@prisma/client'
import type { ServerResponse } from 'http'
import type { Client as MinioClient } from 'minio'
import type { Server as SocketIoServer } from 'socket.io'

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
