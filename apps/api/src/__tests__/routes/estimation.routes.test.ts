import { describe, expect, it } from 'vitest'

import { buildEstimationTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'
const PROJECT_ID = 'proj-1'
const ESTIMATE_ID = 'est-1'

const mockEstimate = {
  id: ESTIMATE_ID,
  name: 'Phase 1 Estimate',
  description: null,
  notes: null,
  status: 'DRAFT',
  bidDueDate: null,
  totalCost: '0.00',
  organizationId: ORG_ID,
  projectId: PROJECT_ID,
  createdById: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
  bidResults: [],
}

const mockItem = {
  id: 'item-1',
  description: 'Concrete Flatwork',
  quantity: '100.0000',
  unit: 'SF',
  unitCost: '4.5000',
  totalCost: '450.00',
  costCode: '03300',
  sortOrder: 0,
  notes: null,
  estimateId: ESTIMATE_ID,
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  vendorQuotes: [],
}

const mockBidResult = {
  id: 'bid-1',
  competitorName: 'ABC Construction',
  bidAmount: '500000.00',
  notes: null,
  isAwarded: false,
  submittedAt: new Date(),
  estimateId: ESTIMATE_ID,
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

async function buildApp(prisma?: MockPrisma) {
  return buildEstimationTestApp(prisma)
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

// ─── Org-level list ──────────────────────────────────────────────────────────

describe('GET /api/v1/estimation', () => {
  it('returns 200 with estimates array', async () => {
    const prisma = createMockPrisma()
    prisma.estimate.findMany.mockResolvedValue([mockEstimate])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/estimation',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('returns 401 when unauthenticated', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/estimation' })
    expect(res.statusCode).toBe(401)
  })
})

// ─── Project-scoped ───────────────────────────────────────────────────────────

describe('GET /api/v1/estimation/:projectId', () => {
  it('returns 200 with project estimates', async () => {
    const prisma = createMockPrisma()
    prisma.estimate.findMany.mockResolvedValue([mockEstimate])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/estimation/${PROJECT_ID}`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
  })
})

describe('POST /api/v1/estimation/:projectId', () => {
  it('returns 201 when Admin creates estimate', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.project.findFirst.mockResolvedValue({ id: PROJECT_ID })
    prisma.estimate.create.mockResolvedValue(mockEstimate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Phase 1 Estimate' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 when FieldUser attempts', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}`,
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 400 when name is missing', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/v1/estimation/:projectId/:estimateId', () => {
  it('returns 200 with estimate + items + bid results', async () => {
    const prisma = createMockPrisma()
    prisma.estimate.findFirst.mockResolvedValue(mockEstimate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(ESTIMATE_ID)
  })

  it('returns 404 when estimate not found', async () => {
    const prisma = createMockPrisma()
    prisma.estimate.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/estimation/${PROJECT_ID}/missing`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/v1/estimation/:projectId/:estimateId', () => {
  it('returns 204 when Admin deletes', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.estimate.findFirst.mockResolvedValue(mockEstimate)
    prisma.estimate.delete.mockResolvedValue(mockEstimate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 when PM attempts', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}`,
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

// ─── Items ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/estimation/:projectId/:estimateId/items', () => {
  it('returns 201 when PM creates item', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    prisma.estimate.findFirst.mockResolvedValue(mockEstimate)
    prisma.estimateItem.create.mockResolvedValue(mockItem)
    prisma.estimateItem.aggregate.mockResolvedValue({ _sum: { totalCost: '450.00' } })
    prisma.estimate.update.mockResolvedValue(mockEstimate)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}/items`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Concrete Flatwork', quantity: 100, unitCost: 4.5 }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 when FieldUser attempts', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}/items`,
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Test', quantity: 1, unitCost: 1.0 }),
    })
    expect(res.statusCode).toBe(403)
  })
})

// ─── Bid Results ──────────────────────────────────────────────────────────────

describe('POST /api/v1/estimation/:projectId/:estimateId/bid-results', () => {
  it('returns 201 with Admin token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.estimate.findFirst.mockResolvedValue(mockEstimate)
    prisma.bidResult.create.mockResolvedValue(mockBidResult)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/estimation/${PROJECT_ID}/${ESTIMATE_ID}/bid-results`,
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({
        competitorName: 'ABC Construction',
        bidAmount: 500000,
        submittedAt: new Date().toISOString(),
      }),
    })
    expect(res.statusCode).toBe(201)
  })
})
