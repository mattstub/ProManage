import type { FastifyRequest } from 'fastify'
import type { RateLimitOptions } from '@fastify/rate-limit'

/**
 * Route-level rate limit configurations.
 * These provide stricter limits than the global rate limiter for sensitive operations.
 *
 * CodeQL flags auth-gated routes without explicit rate limiting as a security concern.
 * These preHandlers address that by adding per-route limits on top of global limits.
 */

// Rate limit presets (requests per window)
export const RATE_LIMITS = {
  // Read operations — moderate limit
  READ: { max: 100, timeWindow: '1 minute' },

  // Write operations — stricter limit
  WRITE: { max: 30, timeWindow: '1 minute' },

  // Sensitive operations (delete, admin actions) — strictest
  SENSITIVE: { max: 10, timeWindow: '1 minute' },

  // Bulk/export operations
  BULK: { max: 5, timeWindow: '1 minute' },
} as const

type RateLimitPreset = keyof typeof RATE_LIMITS

/**
 * Creates a route-level rate limit configuration.
 * Uses user ID as the key generator for authenticated routes.
 */
export function routeRateLimit(
  preset: RateLimitPreset,
  customOptions?: Partial<RateLimitOptions>
): { config: { rateLimit: RateLimitOptions } } {
  const baseConfig = RATE_LIMITS[preset]

  return {
    config: {
      rateLimit: {
        max: baseConfig.max,
        timeWindow: baseConfig.timeWindow,
        keyGenerator: (request: FastifyRequest) => {
          // Use user ID for authenticated routes, fall back to IP
          return request.user?.id ?? request.ip
        },
        ...customOptions,
      },
    },
  }
}
