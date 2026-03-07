import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { FastifyInstance } from 'fastify'

import { UnauthorizedError } from '../../lib/errors'
import * as authService from '../../services/auth.service'
import { createMockPrisma } from '../helpers/mock-prisma'

// Mock bcrypt so tests don't pay the hashing cost
vi.mock('../../services/password.service', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn(),
}))

// Mock token service so we control output
vi.mock('../../services/token.service', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  getRefreshTokenExpiry: vi.fn().mockReturnValue(new Date('2099-01-01')),
}))

import { comparePassword } from '../../services/password.service'

function buildMockFastify() {
  const prisma = createMockPrisma()
  return {
    fastify: { prisma, jwt: { sign: vi.fn().mockReturnValue('mock-access-token') } } as unknown as FastifyInstance,
    prisma,
  }
}

const baseUser = {
  id: 'user-1',
  email: 'user@example.com',
  passwordHash: 'hashed-password',
  firstName: 'Jane',
  lastName: 'Doe',
  phone: null,
  avatarUrl: null,
  isActive: true,
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  userRoles: [{ role: { name: 'Admin' } }],
}

describe('authService.login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns user and tokens for valid credentials', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findUnique.mockResolvedValue(baseUser)
    prisma.user.update.mockResolvedValue(baseUser)
    prisma.refreshToken.create.mockResolvedValue({})
    vi.mocked(comparePassword).mockResolvedValue(true)

    const result = await authService.login(fastify, {
      email: 'user@example.com',
      password: 'Password1',
    })

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.user.email).toBe('user@example.com')
    expect(result.user.roles).toEqual(['Admin'])
  })

  it('throws UnauthorizedError when user is not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(
      authService.login(fastify, { email: 'nobody@example.com', password: 'pw' })
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws UnauthorizedError when password is wrong', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findUnique.mockResolvedValue(baseUser)
    vi.mocked(comparePassword).mockResolvedValue(false)

    await expect(
      authService.login(fastify, { email: 'user@example.com', password: 'wrong' })
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws UnauthorizedError when user account is inactive', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, isActive: false })

    await expect(
      authService.login(fastify, { email: 'user@example.com', password: 'Password1' })
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })
})

describe('authService.refresh', () => {
  beforeEach(() => vi.clearAllMocks())

  const baseToken = {
    id: 'token-1',
    token: 'valid-refresh-token',
    userId: 'user-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86_400_000), // 1 day from now
    user: {
      ...baseUser,
      userRoles: [{ role: { name: 'Admin' } }],
    },
  }

  it('returns new access and refresh tokens for a valid token', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.findUnique.mockResolvedValue(baseToken)
    prisma.$transaction.mockResolvedValue([{}, {}])

    const result = await authService.refresh(fastify, 'valid-refresh-token')

    expect(result.accessToken).toBe('mock-access-token')
    expect(result.refreshToken).toBe('mock-refresh-token')
  })

  it('throws UnauthorizedError when token is not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.findUnique.mockResolvedValue(null)

    await expect(
      authService.refresh(fastify, 'nonexistent-token')
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws UnauthorizedError when token is already revoked', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...baseToken,
      revokedAt: new Date(),
    })

    await expect(
      authService.refresh(fastify, 'revoked-token')
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws UnauthorizedError when token is expired', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...baseToken,
      expiresAt: new Date('2020-01-01'), // in the past
    })

    await expect(
      authService.refresh(fastify, 'expired-token')
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws UnauthorizedError when the associated user is inactive', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.findUnique.mockResolvedValue({
      ...baseToken,
      user: { ...baseToken.user, isActive: false },
    })

    await expect(
      authService.refresh(fastify, 'valid-refresh-token')
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })
})

describe('authService.logout', () => {
  it('revokes the refresh token in the database', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 })

    await authService.logout(fastify, 'some-token')

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token: 'some-token', revokedAt: null }),
      })
    )
  })
})
