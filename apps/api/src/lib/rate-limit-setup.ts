import rateLimit from '@fastify/rate-limit'

import type { FastifyInstance } from 'fastify'

/**
 * Registers @fastify/rate-limit on the provided Fastify instance with `global: false`.
 *
 * Must be called at the top of every route plugin before any `fastify.rateLimit()`
 * calls. Consistent registration across all route files allows CodeQL's
 * `js/missing-rate-limiting` analysis to trace the rate-limit setup and avoids
 * false-positive alerts on sensitive endpoints such as `/auth/login`.
 */
export async function setupRateLimit(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, { global: false })
}
