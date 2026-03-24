import { describe, expect, it } from 'vitest'

import { buildProposalTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }

const mockProposal = {
  id: 'prop-1',
  proposalNumber: 1,
  title: 'Office Building Bid',
  status: 'DRAFT',
  coverLetter: null,
  terms: null,
  validUntil: null,
  submittedAt: null,
  estimateId: null,
  organizationId: ORG_ID,
  projectId: null,
  customerId: null,
  templateId: null,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: null,
  customer: null,
  createdBy: mockUser,
  template: null,
  lineItems: [],
}

const mockTemplate = {
  id: 'tmpl-1',
  name: 'Standard Proposal',
  description: null,
  coverLetter: 'Thank you for the opportunity...',
  terms: 'Payment due net 30.',
  isActive: true,
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

async function buildApp(prisma?: MockPrisma) {
  return buildProposalTestApp(prisma)
}

function adminToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'admin@example.com', organizationId: ORG_ID })
}

function fieldToken(app: Awaited<ReturnType<typeof buildApp>>['app']) {
  return 'Bearer ' + signTestToken(app, { sub: USER_ID, email: 'field@example.com', organizationId: ORG_ID })
}

function mockRole(prisma: MockPrisma, roleName: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: roleName } }] as any)
}

// ─── Proposals ───────────────────────────────────────────────────────────────

describe('GET /api/v1/proposals', () => {
  it('returns 200 with list when authenticated', async () => {
    const prisma = createMockPrisma()
    prisma.proposal.findMany.mockResolvedValue([mockProposal])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/proposals',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('returns 401 without auth', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/proposals' })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/v1/proposals/:id', () => {
  it('returns 200 with single proposal', async () => {
    const prisma = createMockPrisma()
    prisma.proposal.findFirst.mockResolvedValue(mockProposal)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/proposals/prop-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.title).toBe('Office Building Bid')
  })

  it('returns 404 when not found', async () => {
    const prisma = createMockPrisma()
    prisma.proposal.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/proposals/missing',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/v1/proposals', () => {
  it('returns 201 created by Admin', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposal.count.mockResolvedValue(0)
    prisma.proposal.create.mockResolvedValue(mockProposal)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Office Building Bid' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 when FieldUser', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 400 when title missing', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/proposals/:id', () => {
  it('returns 200 when updated', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposal.findFirst.mockResolvedValue(mockProposal)
    prisma.proposal.update.mockResolvedValue({ ...mockProposal, status: 'SENT' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/proposals/prop-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'SENT' }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when not found', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposal.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/proposals/missing',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'SENT' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/v1/proposals/:id', () => {
  it('returns 204 no content', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposal.findFirst.mockResolvedValue(mockProposal)
    prisma.proposal.delete.mockResolvedValue(mockProposal)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/proposals/prop-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 when ProjectManager', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/proposals/prop-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('PUT /api/v1/proposals/:id/line-items', () => {
  it('returns 200 after replacing line items', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposal.findFirst.mockResolvedValue(mockProposal)
    prisma.$transaction.mockResolvedValue([{ count: 0 }, { count: 1 }])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PUT',
      url: '/api/v1/proposals/prop-1/line-items',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        lineItems: [{ description: 'Concrete', quantity: 100, unitPrice: 5.0 }],
      }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('POST /api/v1/proposals/from-estimate/:estimateId', () => {
  it('returns 501 not implemented', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals/from-estimate/est-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.statusCode).toBe(501)
  })
})

// ─── Templates ───────────────────────────────────────────────────────────────

describe('GET /api/v1/proposals/templates', () => {
  it('returns 200 with templates list', async () => {
    const prisma = createMockPrisma()
    prisma.proposalTemplate.findMany.mockResolvedValue([mockTemplate])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/proposals/templates',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })
})

describe('POST /api/v1/proposals/templates', () => {
  it('returns 201 when Admin creates template', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposalTemplate.create.mockResolvedValue(mockTemplate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/proposals/templates',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Standard Proposal' }),
    })
    expect(res.statusCode).toBe(201)
  })
})

describe('PATCH /api/v1/proposals/templates/:id', () => {
  it('returns 200 when updated', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposalTemplate.findFirst.mockResolvedValue(mockTemplate)
    prisma.proposalTemplate.update.mockResolvedValue({ ...mockTemplate, name: 'Updated' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/proposals/templates/tmpl-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('DELETE /api/v1/proposals/templates/:id', () => {
  it('returns 204 with Admin token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.proposalTemplate.findFirst.mockResolvedValue(mockTemplate)
    prisma.proposalTemplate.delete.mockResolvedValue(mockTemplate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/proposals/templates/tmpl-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })
})
