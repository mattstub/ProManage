import { ERROR_CODES } from '@promanage/core'

import { ConflictError, UnauthorizedError } from '../lib/errors'

import { hashPassword, comparePassword } from './password.service'
import {
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from './token.service'

import type { RegisterInput, LoginInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function register(fastify: FastifyInstance, input: RegisterInput) {
  const { prisma } = fastify

  // Check for existing email
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })
  if (existingUser) {
    throw new ConflictError(
      'An account with this email already exists',
      ERROR_CODES.EMAIL_ALREADY_EXISTS
    )
  }

  // Create organization
  let slug = slugify(input.organizationName)
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  })
  if (existingOrg) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  const passwordHash = await hashPassword(input.password)

  // Transaction: create org, roles, user, assign admin role
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
      },
    })

    // Create default Admin role for this org
    const adminRole = await tx.role.create({
      data: {
        name: 'Admin',
        description: 'Full system access',
        isSystem: true,
        organizationId: org.id,
      },
    })

    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        organizationId: org.id,
      },
    })

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    })

    return { user, org, roles: ['Admin'] }
  })

  // Generate tokens
  const accessToken = signAccessToken(fastify, {
    sub: result.user.id,
    email: result.user.email,
    organizationId: result.org.id,
  })

  const refreshToken = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: result.user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  })

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      phone: result.user.phone,
      avatarUrl: result.user.avatarUrl,
      isActive: result.user.isActive,
      organizationId: result.org.id,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt,
      roles: result.roles,
    },
    accessToken,
    refreshToken,
  }
}

export async function login(fastify: FastifyInstance, input: LoginInput) {
  const { prisma } = fastify

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      userRoles: { include: { role: true } },
    },
  })

  if (!user) {
    throw new UnauthorizedError(
      'Invalid email or password',
      ERROR_CODES.INVALID_CREDENTIALS
    )
  }

  if (!user.isActive) {
    throw new UnauthorizedError(
      'Account is deactivated',
      ERROR_CODES.USER_INACTIVE
    )
  }

  const valid = await comparePassword(input.password, user.passwordHash)
  if (!valid) {
    throw new UnauthorizedError(
      'Invalid email or password',
      ERROR_CODES.INVALID_CREDENTIALS
    )
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const roles = user.userRoles.map((ur) => ur.role.name)

  const accessToken = signAccessToken(fastify, {
    sub: user.id,
    email: user.email,
    organizationId: user.organizationId,
  })

  const refreshToken = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      organizationId: user.organizationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
    },
    accessToken,
    refreshToken,
  }
}

export async function refresh(fastify: FastifyInstance, token: string) {
  const { prisma } = fastify

  const existing = await prisma.refreshToken.findUnique({
    where: { token },
    include: {
      user: {
        include: { userRoles: { include: { role: true } } },
      },
    },
  })

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new UnauthorizedError('Invalid refresh token', ERROR_CODES.TOKEN_INVALID)
  }

  if (!existing.user.isActive) {
    throw new UnauthorizedError('Account is deactivated', ERROR_CODES.USER_INACTIVE)
  }

  // Token rotation: revoke old, issue new
  const newRefreshToken = generateRefreshToken()

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: existing.userId,
        expiresAt: getRefreshTokenExpiry(),
      },
    }),
  ])

  const accessToken = signAccessToken(fastify, {
    sub: existing.user.id,
    email: existing.user.email,
    organizationId: existing.user.organizationId,
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
  }
}

export async function logout(fastify: FastifyInstance, token: string) {
  await fastify.prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function getMe(fastify: FastifyInstance, userId: string) {
  const user = await fastify.prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      organization: true,
    },
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    organizationId: user.organizationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles.map((ur) => ur.role.name),
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      slug: user.organization.slug,
    },
  }
}
