import { describe, it, expect, vi, beforeEach } from 'vitest'


import { NotFoundError } from '../../lib/errors'
import * as contactService from '../../services/contact.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { FastifyInstance } from 'fastify'

function buildMockFastify() {
  const prisma = createMockPrisma()
  return {
    fastify: { prisma } as unknown as FastifyInstance,
    prisma,
  }
}

const baseContact = {
  id: 'contact-1',
  firstName: 'Robert',
  lastName: 'Chen',
  company: 'Chen Electrical Services',
  type: 'SUBCONTRACTOR',
  email: 'robert@chenelectrical.com',
  phone: '(555) 200-0001',
  mobile: '(555) 200-0011',
  title: 'Owner',
  notes: null,
  isActive: true,
  organizationId: 'org-1',
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: {
    id: 'user-1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@demo.com',
  },
  projectContacts: [],
}

const baseProject = {
  id: 'project-1',
  name: 'Downtown Office',
  number: 'PRJ-001',
}

describe('contactService.listContacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated contacts filtered by organizationId', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(1)

    const result = await contactService.listContacts(fastify, 'org-1', {})

    expect(result.contacts).toHaveLength(1)
    expect(result.contacts[0].firstName).toBe('Robert')
    expect(result.meta.total).toBe(1)
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1' },
      })
    )
  })

  it('filters contacts by type when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(1)

    await contactService.listContacts(fastify, 'org-1', { type: 'SUBCONTRACTOR' })

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', type: 'SUBCONTRACTOR' },
      })
    )
  })

  it('applies search filter across name, company, and email', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findMany.mockResolvedValue([])
    prisma.contact.count.mockResolvedValue(0)

    await contactService.listContacts(fastify, 'org-1', { search: 'chen' })

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          OR: expect.arrayContaining([
            expect.objectContaining({ firstName: expect.objectContaining({ contains: 'chen' }) }),
            expect.objectContaining({ lastName: expect.objectContaining({ contains: 'chen' }) }),
            expect.objectContaining({ company: expect.objectContaining({ contains: 'chen' }) }),
            expect.objectContaining({ email: expect.objectContaining({ contains: 'chen' }) }),
          ]),
        }),
      })
    )
  })

  it('returns empty array when no contacts exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findMany.mockResolvedValue([])
    prisma.contact.count.mockResolvedValue(0)

    const result = await contactService.listContacts(fastify, 'org-1', {})

    expect(result.contacts).toHaveLength(0)
    expect(result.meta.total).toBe(0)
  })

  it('respects pagination parameters', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(50)

    const result = await contactService.listContacts(fastify, 'org-1', {
      page: '2',
      perPage: '10',
    })

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
    expect(result.meta.page).toBe(2)
    expect(result.meta.perPage).toBe(10)
  })
})

describe('contactService.getContact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns contact if it exists in the same organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)

    const result = await contactService.getContact(fastify, 'contact-1', 'org-1')

    expect(result.id).toBe('contact-1')
    expect(result.firstName).toBe('Robert')
    expect(prisma.contact.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contact-1', organizationId: 'org-1' },
      })
    )
  })

  it('throws NotFoundError if contact does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.getContact(fastify, 'nonexistent', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError if contact is in a different organization', async () => {
    const { fastify, prisma } = buildMockFastify()
    // Org scoping: query includes organizationId so result is null for wrong org
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.getContact(fastify, 'contact-1', 'org-2')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('contactService.createContact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates contact with correct fields and createdById', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.create.mockResolvedValue(baseContact)

    const input = {
      firstName: 'Robert',
      lastName: 'Chen',
      type: 'SUBCONTRACTOR' as const,
      company: 'Chen Electrical Services',
      email: 'robert@chenelectrical.com',
    }

    const result = await contactService.createContact(fastify, 'org-1', 'user-1', input)

    expect(result.firstName).toBe('Robert')
    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'Robert',
          lastName: 'Chen',
          type: 'SUBCONTRACTOR',
          organizationId: 'org-1',
          createdById: 'user-1',
        }),
      })
    )
  })

  it('creates contact with minimal required fields', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.create.mockResolvedValue({
      ...baseContact,
      company: null,
      email: null,
      phone: null,
    })

    const input = { firstName: 'Jane', lastName: 'Doe', type: 'CUSTOMER' as const }

    await contactService.createContact(fastify, 'org-1', 'user-1', input)

    expect(prisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstName: 'Jane', lastName: 'Doe', type: 'CUSTOMER' }),
      })
    )
  })
})

describe('contactService.updateContact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates contact when it exists in the org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.contact.update.mockResolvedValue({ ...baseContact, firstName: 'Bob' })

    const result = await contactService.updateContact(
      fastify,
      'contact-1',
      'org-1',
      { firstName: 'Bob' }
    )

    expect(result.firstName).toBe('Bob')
    expect(prisma.contact.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contact-1' },
        data: { firstName: 'Bob' },
      })
    )
  })

  it('can deactivate contact via isActive flag', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.contact.update.mockResolvedValue({ ...baseContact, isActive: false })

    const result = await contactService.updateContact(
      fastify,
      'contact-1',
      'org-1',
      { isActive: false }
    )

    expect(result.isActive).toBe(false)
  })

  it('throws NotFoundError when contact does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.updateContact(fastify, 'nonexistent', 'org-1', { firstName: 'Bob' })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError when contact is in a different org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.updateContact(fastify, 'contact-1', 'org-2', { firstName: 'Bob' })
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('contactService.deleteContact', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes contact when it exists', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.contact.delete.mockResolvedValue(baseContact)

    await contactService.deleteContact(fastify, 'contact-1', 'org-1')

    expect(prisma.contact.delete).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    })
  })

  it('throws NotFoundError when contact does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.deleteContact(fastify, 'nonexistent', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError when contact belongs to different org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.deleteContact(fastify, 'contact-1', 'org-2')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('contactService.addContactToProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates ContactProject association when both contact and project exist in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.contactProject.upsert.mockResolvedValue({
      contactId: 'contact-1',
      projectId: 'project-1',
      assignedAt: new Date(),
    })

    await contactService.addContactToProject(fastify, 'contact-1', 'project-1', 'org-1')

    expect(prisma.contactProject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contactId_projectId: { contactId: 'contact-1', projectId: 'project-1' } },
        create: { contactId: 'contact-1', projectId: 'project-1' },
      })
    )
  })

  it('throws NotFoundError if contact does not belong to the org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.addContactToProject(fastify, 'contact-1', 'project-1', 'org-2')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError if project does not belong to the org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      contactService.addContactToProject(fastify, 'contact-1', 'invalid-project', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('validates project belongs to same org to prevent cross-org linking', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      contactService.addContactToProject(fastify, 'contact-1', 'other-org-project', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)

    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-org-project', organizationId: 'org-1' },
    })
  })
})

describe('contactService.removeContactFromProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes ContactProject association when both exist in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.contactProject.delete.mockResolvedValue({})

    await contactService.removeContactFromProject(fastify, 'contact-1', 'project-1', 'org-1')

    expect(prisma.contactProject.delete).toHaveBeenCalledWith({
      where: { contactId_projectId: { contactId: 'contact-1', projectId: 'project-1' } },
    })
  })

  it('throws NotFoundError if contact does not exist in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      contactService.removeContactFromProject(fastify, 'contact-1', 'project-1', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws NotFoundError if project does not exist in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      contactService.removeContactFromProject(fastify, 'contact-1', 'project-1', 'org-1')
    ).rejects.toBeInstanceOf(NotFoundError)
  })
})
