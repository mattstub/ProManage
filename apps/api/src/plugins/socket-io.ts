import fp from 'fastify-plugin'
import { Server } from 'socket.io'

import type { FastifyPluginAsync } from 'fastify'
import { config } from '../config'

const socketIoPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onReady', async () => {
    const io = new Server(fastify.server, {
      cors: {
        origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()),
        credentials: true,
      },
    })

    io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth['token'] ??
          socket.handshake.headers['authorization']?.replace('Bearer ', '')

        if (!token) {
          return next(new Error('Unauthorized'))
        }

        const payload = fastify.jwt.verify<{
          sub: string
          email: string
          organizationId: string
        }>(token)

        socket.data['userId'] = payload.sub
        socket.data['organizationId'] = payload.organizationId
        next()
      } catch {
        next(new Error('Unauthorized'))
      }
    })

    io.on('connection', (socket) => {
      const userId = socket.data['userId'] as string
      const organizationId = socket.data['organizationId'] as string

      // Join org-wide room and user-specific room
      void socket.join(`org:${organizationId}`)
      void socket.join(`user:${userId}`)

      fastify.log.debug({ userId, organizationId }, 'Socket.io client connected')

      socket.on('disconnect', () => {
        fastify.log.debug({ userId }, 'Socket.io client disconnected')
      })
    })

    fastify.decorate('io', io)
    fastify.log.info('Socket.io plugin registered')
  })
}

export default fp(socketIoPlugin, { name: 'socket-io' })
