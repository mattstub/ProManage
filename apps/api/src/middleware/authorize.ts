import { ForbiddenError } from '../lib/errors'

import type { RoleName } from '@promanage/core'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Middleware factory that checks if the user has at least one of the required roles.
 */
export function requireRole(...roles: RoleName[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const { prisma, user } = request.server
      ? { prisma: request.server.prisma, user: request.user }
      : { prisma: null, user: null }

    if (!prisma || !user) {
      throw new ForbiddenError('Insufficient permissions')
    }

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: user.id,
        role: {
          organizationId: user.organizationId,
        },
      },
      include: { role: true },
    })

    const userRoleNames = userRoles.map((ur) => ur.role.name)
    const hasRole = roles.some((r) => userRoleNames.includes(r))

    if (!hasRole) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}

/**
 * Middleware factory that checks if the user has a specific permission (resource + action).
 */
export function requirePermission(resource: string, action: string) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const { prisma, user } = request.server
      ? { prisma: request.server.prisma, user: request.user }
      : { prisma: null, user: null }

    if (!prisma || !user) {
      throw new ForbiddenError('Insufficient permissions')
    }

    const count = await prisma.rolePermission.count({
      where: {
        role: {
          organizationId: user.organizationId,
          userRoles: {
            some: { userId: user.id },
          },
        },
        permission: {
          resource,
          action,
        },
      },
    })

    if (count === 0) {
      throw new ForbiddenError('Insufficient permissions')
    }
  }
}
