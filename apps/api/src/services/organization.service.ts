import { NotFoundError } from '../lib/errors'

import type { UpdateOrganizationSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

export async function getOrganization(
  fastify: FastifyInstance,
  organizationId: string
) {
  const org = await fastify.prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!org) {
    throw new NotFoundError('Organization not found')
  }

  return org
}

export async function updateOrganization(
  fastify: FastifyInstance,
  organizationId: string,
  input: UpdateOrganizationSchemaInput
) {
  const org = await fastify.prisma.organization.update({
    where: { id: organizationId },
    data: input,
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return org
}
