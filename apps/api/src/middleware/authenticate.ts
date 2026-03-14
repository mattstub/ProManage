import { UnauthorizedError } from '../lib/errors'

import type { FastifyReply, FastifyRequest } from 'fastify'

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify<{
      sub: string
      email: string
      organizationId: string
    }>()
    request.user = {
      id: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
    }
    // Enrich the per-request logger so all downstream logs carry user context
    request.log = request.log.child({
      userId: payload.sub,
      organizationId: payload.organizationId,
    })
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
