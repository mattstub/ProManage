import { UnauthorizedError } from '../lib/errors'

import type { FastifyReply, FastifyRequest } from 'fastify'

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const payload = await request.jwtVerify()
    request.user = {
      id: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }
}
