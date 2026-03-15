import fp from 'fastify-plugin'

import type { FastifyPluginAsync } from 'fastify'
import type { ServerResponse } from 'http'

const ssePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('sseClients', new Map<string, Set<ServerResponse>>())
}

export default fp(ssePlugin, { name: 'sse' })
