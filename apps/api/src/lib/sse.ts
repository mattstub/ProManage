import type { FastifyInstance } from 'fastify'

/**
 * Pushes an SSE event to all active connections for a given user.
 * Silently skips users with no active connections.
 */
export function emitToUser(
  fastify: FastifyInstance,
  userId: string,
  eventName: string,
  data: unknown
): void {
  const clients = fastify.sseClients.get(userId)
  if (!clients || clients.size === 0) return

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of clients) {
    if (!client.writableEnded) {
      client.write(payload)
    }
  }
}
