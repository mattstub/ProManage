import { parsePagination, buildPaginationMeta } from '@promanage/core'

import { NotFoundError } from '../lib/errors'

import type { UpdateUserSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

export async function listUsers(
  fastify: FastifyInstance,
  organizationId: string,
  query: { page?: string; perPage?: string }
) {
  const { skip, take, page, perPage } = parsePagination(query)

  const [users, total] = await Promise.all([
    fastify.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: { role: { select: { name: true } } },
        },
      },
      orderBy: { lastName: 'asc' },
      skip,
      take,
    }),
    fastify.prisma.user.count({ where: { organizationId } }),
  ])

  const data = users.map((u) => ({
    ...u,
    roles: u.userRoles.map((ur) => ur.role.name),
    userRoles: undefined,
  }))

  return { data, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getUser(
  fastify: FastifyInstance,
  userId: string,
  organizationId: string
) {
  const user = await fastify.prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        include: { role: { select: { name: true } } },
      },
    },
  })

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return {
    ...user,
    roles: user.userRoles.map((ur) => ur.role.name),
    userRoles: undefined,
  }
}

export async function updateUser(
  fastify: FastifyInstance,
  userId: string,
  organizationId: string,
  input: UpdateUserSchemaInput
) {
  // Verify user belongs to org
  const existing = await fastify.prisma.user.findFirst({
    where: { id: userId, organizationId },
  })

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  const user = await fastify.prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return user
}

export async function deactivateUser(
  fastify: FastifyInstance,
  userId: string,
  organizationId: string
) {
  const existing = await fastify.prisma.user.findFirst({
    where: { id: userId, organizationId },
  })

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  await fastify.prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  })
}
