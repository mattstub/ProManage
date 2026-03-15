import type { PaginationMeta } from '@promanage/core'
import type { FastifyReply } from 'fastify'

export function success<T>(reply: FastifyReply, data: T, statusCode = 200) {
  return reply.status(statusCode).send({ data })
}

export function created<T>(reply: FastifyReply, data: T) {
  return success(reply, data, 201)
}

export function paginated<T>(
  reply: FastifyReply,
  data: T[],
  meta: PaginationMeta
) {
  return reply.status(200).send({ data, meta })
}

export function noContent(reply: FastifyReply) {
  return reply.status(204).send()
}
