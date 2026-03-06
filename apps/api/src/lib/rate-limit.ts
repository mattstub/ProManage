/**
 * Route-level rate limit configurations.
 * These provide stricter limits than the global rate limiter for sensitive operations.
 *
 * CodeQL flags auth-gated routes without explicit rate limiting as a security concern.
 * These configs address that by adding per-route limits on top of global limits.
 *
 * Usage: { config: { rateLimit: RATE_LIMITS.READ } }
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
