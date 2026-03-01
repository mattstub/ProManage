import crypto from 'node:crypto'

import { config } from '../config'

import type { FastifyInstance } from 'fastify'

export function signAccessToken(
  fastify: FastifyInstance,
  payload: { sub: string; email: string; organizationId: string }
) {
  return fastify.jwt.sign(payload, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN,
  })
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex')
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000 // default 7 days

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 7 * 24 * 60 * 60 * 1000
  }
}

export function getRefreshTokenExpiry(): Date {
  const ms = parseDuration(config.JWT_REFRESH_EXPIRES_IN)
  return new Date(Date.now() + ms)
}
