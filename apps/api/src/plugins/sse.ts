import fp from 'fastify-plugin'

import type { ServerResponse } from 'http'
import type { FastifyPluginAsync } from 'fastify'

const ssePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('sseClients', new Map<string, Set<ServerResponse>>())
}

export default fp(ssePlugin, { name: 'sse' })
