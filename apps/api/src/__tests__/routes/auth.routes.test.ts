import { describe, it, expect, vi, beforeEach } from 'vitest'

import { comparePassword } from '../../services/password.service'
import { buildAuthTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

// Mock bcrypt to keep tests fast
vi.mock('../../services/password.service', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  comparePassword: vi.fn(),
}))

const baseUser = {
  id: 'user-1',
  email: 'admin@demo.com',
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
  organization: { id: 'org-1', name: 'Demo Org', slug: 'demo-org' },
}

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with user, accessToken, and sets refresh_token cookie on success', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.user.findUnique.mockResolvedValue(baseUser)
    prisma.user.update.mockResolvedValue(baseUser)
    prisma.refreshToken.create.mockResolvedValue({})
    vi.mocked(comparePassword).mockResolvedValue(true)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@demo.com', password: 'Password1' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.user.email).toBe('admin@demo.com')
    expect(body.data.accessToken).toBeDefined()
    expect(res.headers['set-cookie']).toMatch(/refresh_token=/)
    expect(res.headers['set-cookie']).toMatch(/HttpOnly/)

    await app.close()
  })

  it('returns 401 for wrong password', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.user.findUnique.mockResolvedValue(baseUser)
    vi.mocked(comparePassword).mockResolvedValue(false)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@demo.com', password: 'wrong' },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 for non-existent user', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'ghost@example.com', password: 'Password1' },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 400 for missing required fields', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@demo.com' }, // missing password
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })

  it('returns 400 for invalid email format', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'not-an-email', password: 'Password1' },
    })

    expect(res.statusCode).toBe(400)

    await app.close()
  })
})

describe('POST /api/v1/auth/refresh', () => {
  beforeEach(() => vi.clearAllMocks())

  const validDbToken = {
    id: 'rt-1',
    token: 'valid-refresh-token',
    userId: 'user-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    user: baseUser,
  }

  it('returns 200 with a new accessToken and rotates the refresh_token cookie', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.refreshToken.findUnique.mockResolvedValue(validDbToken)
    prisma.$transaction.mockResolvedValue([{}, {}])

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: { cookie: 'refresh_token=valid-refresh-token' },
      payload: {},
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.accessToken).toBeDefined()
    expect(res.headers['set-cookie']).toMatch(/refresh_token=/)

    await app.close()
  })

  it('returns 401 when no refresh_token cookie is present', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {},
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 when the refresh token is not in the database', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.refreshToken.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: { cookie: 'refresh_token=invalid-token' },
      payload: {},
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 when the refresh token is expired', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.refreshToken.findUnique.mockResolvedValue({
      ...validDbToken,
      expiresAt: new Date('2020-01-01'),
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: { cookie: 'refresh_token=expired-token' },
      payload: {},
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 when the refresh token has been revoked', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.refreshToken.findUnique.mockResolvedValue({
      ...validDbToken,
      revokedAt: new Date(),
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      headers: { cookie: 'refresh_token=revoked-token' },
      payload: {},
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks())

  /**
   * THE LOOP FIX TEST
   *
   * Before the fix, logout required authenticate (a valid JWT). A client with
   * an expired access token but a stale httpOnly refresh-token cookie could not
   * call logout → the cookie was never cleared → the Next.js middleware kept
   * seeing it and redirecting to /dashboard → infinite redirect loop.
   *
   * After the fix, logout is unauthenticated. The server revokes whatever
   * refresh token is in the cookie and clears it, even without a valid JWT.
   */
  it('returns 204 and clears the cookie WITHOUT an Authorization header (loop fix)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      // Deliberately no Authorization header — simulates onAuthError scenario
      headers: { cookie: 'refresh_token=some-expired-or-revoked-token' },
    })

    expect(res.statusCode).toBe(204)

    // Cookie must be cleared (maxAge=0 or expiry in the past)
    const setCookie = res.headers['set-cookie'] as string
    expect(setCookie).toMatch(/refresh_token=;/)

    // Refresh token must be revoked in the database
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token: 'some-expired-or-revoked-token',
          revokedAt: null,
        }),
      })
    )

    await app.close()
  })

  it('returns 204 even when no cookie is present', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
    })

    expect(res.statusCode).toBe(204)

    await app.close()
  })
})

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the current user when a valid JWT is provided', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildAuthTestApp(prisma)

    prisma.user.findUnique.mockResolvedValue(baseUser)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.email).toBe('admin@demo.com')

    await app.close()
  })

  it('returns 401 when no Authorization header is provided', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })

  it('returns 401 when the JWT is malformed', async () => {
    const { app } = await buildAuthTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer not.a.valid.jwt' },
    })

    expect(res.statusCode).toBe(401)

    await app.close()
  })
})
