import { describe, it, expect, vi, beforeEach } from 'vitest'

import { buildContactTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

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

describe('GET /api/v1/contacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with list of contacts when authenticated', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].firstName).toBe('Robert')
    expect(body.meta.total).toBe(1)

    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({ method: 'GET', url: '/api/v1/contacts' })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('filters contacts by type query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts?type=SUBCONTRACTOR',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'SUBCONTRACTOR' }),
      })
    )

    await app.close()
  })

  it('applies search query parameter', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findMany.mockResolvedValue([baseContact])
    prisma.contact.count.mockResolvedValue(1)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts?search=chen',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    )

    await app.close()
  })

  it('scopes contacts to the authenticated user organization', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findMany.mockResolvedValue([])
    prisma.contact.count.mockResolvedValue(0)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-2',
    })

    await app.inject({
      method: 'GET',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-2' }),
      })
    )

    await app.close()
  })
})

describe('GET /api/v1/contacts/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with contact when found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findFirst.mockResolvedValue(baseContact)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.id).toBe('contact-1')
    expect(body.data.firstName).toBe('Robert')

    await app.close()
  })

  it('returns 404 when contact not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts/nonexistent',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts/contact-1',
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 404 when contact belongs to different organization', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-2',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })
})

describe('POST /api/v1/contacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 201 with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.create.mockResolvedValue(baseContact)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        firstName: 'Robert',
        lastName: 'Chen',
        type: 'SUBCONTRACTOR',
        email: 'robert@chenelectrical.com',
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.firstName).toBe('Robert')

    await app.close()
  })

  it('returns 201 with ProjectManager role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'ProjectManager' } }])
    prisma.contact.create.mockResolvedValue(baseContact)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'pm@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'CUSTOMER' },
    })

    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('returns 201 with OfficeAdmin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'OfficeAdmin' } }])
    prisma.contact.create.mockResolvedValue(baseContact)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'office@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'VENDOR' },
    })

    expect(res.statusCode).toBe(201)
    await app.close()
  })

  it('returns 403 for FieldUser role (insufficient permissions)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'CONTRACTOR' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'CONTRACTOR' },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when firstName is missing', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { lastName: 'Doe', type: 'CONTRACTOR' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when type is invalid', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'INVALID_TYPE' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 400 when email format is invalid', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Jane', lastName: 'Doe', type: 'CONTRACTOR', email: 'not-an-email' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

describe('PATCH /api/v1/contacts/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 on successful update with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.contact.update.mockResolvedValue({ ...baseContact, firstName: 'Bobby' })

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Bobby' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.firstName).toBe('Bobby')

    await app.close()
  })

  it('returns 403 for FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Bobby' },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when contact not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/contacts/nonexistent',
      headers: { authorization: `Bearer ${token}` },
      payload: { firstName: 'Bobby' },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 400 for invalid email on update', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
      payload: { email: 'not-valid' },
    })

    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/contacts/contact-1',
      payload: { firstName: 'Bobby' },
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })
})

describe('DELETE /api/v1/contacts/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 on successful deletion with Admin role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.contact.delete.mockResolvedValue(baseContact)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 for ProjectManager role (Admin only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'ProjectManager' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'pm@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 403 for OfficeAdmin role (Admin only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'OfficeAdmin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'office@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when contact not found', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/nonexistent',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1',
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })
})

describe('POST /api/v1/contacts/:contactId/projects/:projectId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when Admin associates contact with project', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1', name: 'Downtown Office', number: 'PRJ-001' })
    prisma.contactProject.upsert.mockResolvedValue({})

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/contact-1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 204 when ProjectManager associates contact with project', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'ProjectManager' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1', name: 'Downtown Office', number: 'PRJ-001' })
    prisma.contactProject.upsert.mockResolvedValue({})

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'pm@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/contact-1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 for OfficeAdmin role (Admin/PM only)', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'OfficeAdmin' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'office@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/contact-1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when contact does not exist', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/nonexistent/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 404 when project does not exist in org', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/contact-1/projects/invalid-project',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/contacts/contact-1/projects/project-1',
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })
})

describe('DELETE /api/v1/contacts/:contactId/projects/:projectId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 204 when Admin removes contact from project', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(baseContact)
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1', name: 'Downtown Office', number: 'PRJ-001' })
    prisma.contactProject.delete.mockResolvedValue({})

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    await app.close()
  })

  it('returns 403 for FieldUser role', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'FieldUser' } }])

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'field@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('returns 404 when contact does not exist', async () => {
    const prisma = createMockPrisma()
    const { app } = await buildContactTestApp(prisma)

    prisma.userRole.findMany.mockResolvedValue([{ role: { name: 'Admin' } }])
    prisma.contact.findFirst.mockResolvedValue(null)

    const token = signTestToken(app, {
      sub: 'user-1',
      email: 'admin@demo.com',
      organizationId: 'org-1',
    })

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/nonexistent/projects/project-1',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 401 without authentication', async () => {
    const { app } = await buildContactTestApp()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/contacts/contact-1/projects/project-1',
    })

    expect(res.statusCode).toBe(401)
    await app.close()
  })
})
