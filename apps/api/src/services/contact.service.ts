import { NotFoundError } from '../lib/errors'
import { buildPaginationMeta, parsePagination } from '@promanage/core'

import type { CreateContactSchemaInput, UpdateContactSchemaInput } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const CONTACT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  company: true,
  type: true,
  email: true,
  phone: true,
  mobile: true,
  title: true,
  notes: true,
  isActive: true,
  organizationId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  projectContacts: {
    select: {
      assignedAt: true,
      project: {
        select: {
          id: true,
          name: true,
          number: true,
        },
      },
    },
  },
}

export interface ListContactsQuery {
  page?: string
  perPage?: string
  type?: string
  search?: string
}

export async function listContacts(
  fastify: FastifyInstance,
  organizationId: string,
  query: ListContactsQuery
) {
  const { page, perPage, skip, take } = parsePagination(query)

  const searchFilter = query.search
    ? {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' as const } },
          { lastName: { contains: query.search, mode: 'insensitive' as const } },
          { company: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const where = {
    organizationId,
    ...(query.type ? { type: query.type } : {}),
    ...searchFilter,
  }

  const [contacts, total] = await Promise.all([
    fastify.prisma.contact.findMany({
      where,
      select: CONTACT_SELECT,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip,
      take,
    }),
    fastify.prisma.contact.count({ where }),
  ])

  return { contacts, meta: buildPaginationMeta(total, page, perPage) }
}

export async function getContact(
  fastify: FastifyInstance,
  contactId: string,
  organizationId: string
) {
  const contact = await fastify.prisma.contact.findFirst({
    where: { id: contactId, organizationId },
    select: CONTACT_SELECT,
  })

  if (!contact) {
    throw new NotFoundError('Contact not found')
  }

  return contact
}

export async function createContact(
  fastify: FastifyInstance,
  organizationId: string,
  createdById: string,
  input: CreateContactSchemaInput
) {
  return fastify.prisma.contact.create({
    data: {
      ...input,
      organizationId,
      createdById,
    },
    select: CONTACT_SELECT,
  })
}

export async function updateContact(
  fastify: FastifyInstance,
  contactId: string,
  organizationId: string,
  input: UpdateContactSchemaInput
) {
  await getContact(fastify, contactId, organizationId)

  return fastify.prisma.contact.update({
    where: { id: contactId },
    data: input,
    select: CONTACT_SELECT,
  })
}

export async function deleteContact(
  fastify: FastifyInstance,
  contactId: string,
  organizationId: string
) {
  await getContact(fastify, contactId, organizationId)

  await fastify.prisma.contact.delete({
    where: { id: contactId },
  })
}

export async function addContactToProject(
  fastify: FastifyInstance,
  contactId: string,
  projectId: string,
  organizationId: string
) {
  // Verify contact belongs to this org
  await getContact(fastify, contactId, organizationId)

  // Verify project belongs to this org
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
  })
  if (!project) {
    throw new NotFoundError('Project not found')
  }

  await fastify.prisma.contactProject.upsert({
    where: { contactId_projectId: { contactId, projectId } },
    update: {},
    create: { contactId, projectId },
  })
}

export async function removeContactFromProject(
  fastify: FastifyInstance,
  contactId: string,
  projectId: string,
  organizationId: string
) {
  // Verify contact belongs to this org
  await getContact(fastify, contactId, organizationId)

  // Verify project belongs to this org
  const project = await fastify.prisma.project.findFirst({
    where: { id: projectId, organizationId },
  })
  if (!project) {
    throw new NotFoundError('Project not found')
  }

  await fastify.prisma.contactProject.delete({
    where: { contactId_projectId: { contactId, projectId } },
  })
}
