import { describe, expect, it } from 'vitest'

import { buildMaterialTestApp, signTestToken } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { MockPrisma } from '../helpers/mock-prisma'

const ORG_ID = 'org-1'
const USER_ID = 'user-1'

const mockUser = { id: USER_ID, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }

const mockCostCode = {
  id: 'cc-1',
  organizationId: ORG_ID,
  code: '03-3000',
  description: 'Cast-in-Place Concrete',
  division: 'Division 03',
  accountingRef: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockMaterial = {
  id: 'mat-1',
  organizationId: ORG_ID,
  name: 'Rebar #4',
  description: null,
  sku: 'RB-4',
  unit: 'LF',
  unitCost: '1.2500',
  supplier: 'Steel Supply Co.',
  notes: null,
  isActive: true,
  lastPricedAt: new Date(),
  costCodeId: 'cc-1',
  costCode: { id: 'cc-1', code: '03-3000', description: 'Cast-in-Place Concrete' },
  createdById: USER_ID,
  createdBy: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockHistory = {
  id: 'hist-1',
  materialId: 'mat-1',
  unitCost: '1.2500',
  supplier: 'Steel Supply Co.',
  notes: null,
  recordedAt: new Date(),
  recordedBy: mockUser,
}

async function buildApp(prisma?: MockPrisma) {
  return buildMaterialTestApp(prisma)
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

// ─── Cost Codes ──────────────────────────────────────────────────────────────

describe('GET /api/v1/materials/cost-codes', () => {
  it('returns 200 with valid token', async () => {
    const prisma = createMockPrisma()
    prisma.costCode.findMany.mockResolvedValue([mockCostCode])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/cost-codes',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('returns 401 without token', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/materials/cost-codes' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/materials/cost-codes', () => {
  it('returns 201 with Admin token and valid body', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.create.mockResolvedValue(mockCostCode)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials/cost-codes',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ code: '03-3000', description: 'Cast-in-Place Concrete' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 with FieldUser token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials/cost-codes',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ code: '03-3000', description: 'Test' }),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 400 with missing required fields', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials/cost-codes',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/materials/cost-codes/:id', () => {
  it('returns 200 with Admin token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.findFirst.mockResolvedValue(mockCostCode)
    prisma.costCode.update.mockResolvedValue({ ...mockCostCode, description: 'Updated' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/materials/cost-codes/cc-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Updated' }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when cost code not found', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/materials/cost-codes/missing',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'Updated' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/v1/materials/cost-codes/:id', () => {
  it('returns 204 with Admin token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.findFirst.mockResolvedValue(mockCostCode)
    prisma.material.count.mockResolvedValue(0)
    prisma.costCode.delete.mockResolvedValue(mockCostCode)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/cost-codes/cc-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 with ProjectManager token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/cost-codes/cc-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 409 when materials are linked', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.findFirst.mockResolvedValue(mockCostCode)
    prisma.material.count.mockResolvedValue(3)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/cost-codes/cc-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(409)
  })
})

// ─── Materials ───────────────────────────────────────────────────────────────

describe('GET /api/v1/materials', () => {
  it('returns 200 with pagination meta', async () => {
    const prisma = createMockPrisma()
    prisma.material.findMany.mockResolvedValue([mockMaterial])
    prisma.material.count.mockResolvedValue(1)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.meta).toBeDefined()
  })

  it('returns 401 without token', async () => {
    const { app } = await buildApp()
    const res = await app.inject({ method: 'GET', url: '/api/v1/materials' })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/v1/materials/:id', () => {
  it('returns 200 with full material', async () => {
    const prisma = createMockPrisma()
    prisma.material.findFirst.mockResolvedValue(mockMaterial)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/mat-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('Rebar #4')
  })

  it('returns 404 when not found', async () => {
    const prisma = createMockPrisma()
    prisma.material.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/missing',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/v1/materials', () => {
  it('returns 201 with Admin token and valid body', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.costCode.findFirst.mockResolvedValue(null) // no costCodeId in body
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma))
    prisma.material.create.mockResolvedValue(mockMaterial)
    prisma.materialPriceHistory.create.mockResolvedValue(mockHistory)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Rebar #4', unitCost: 1.25, unit: 'LF' }),
    })
    expect(res.statusCode).toBe(201)
  })

  it('returns 403 with FieldUser token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'FieldUser')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials',
      headers: { authorization: fieldToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test', unitCost: 1.0 }),
    })
    expect(res.statusCode).toBe(403)
  })

  it('returns 400 when unitCost is negative', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/materials',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test', unitCost: -5 }),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('PATCH /api/v1/materials/:id', () => {
  it('returns 200 on price update', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.material.findFirst.mockResolvedValue(mockMaterial)
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma))
    prisma.materialPriceHistory.create.mockResolvedValue(mockHistory)
    prisma.materialPriceHistory.deleteMany.mockResolvedValue({ count: 0 })
    prisma.material.update.mockResolvedValue({ ...mockMaterial, unitCost: '1.5000' })
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/materials/mat-1',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ unitCost: 1.5 }),
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 when material not found', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.material.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/materials/missing',
      headers: { authorization: adminToken(app), 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('DELETE /api/v1/materials/:id', () => {
  it('returns 204 with Admin token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'Admin')
    prisma.material.findFirst.mockResolvedValue(mockMaterial)
    prisma.material.delete.mockResolvedValue(mockMaterial)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/mat-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(204)
  })

  it('returns 403 with ProjectManager token', async () => {
    const prisma = createMockPrisma()
    mockRole(prisma, 'ProjectManager')
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/materials/mat-1',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('GET /api/v1/materials/:id/price-history', () => {
  it('returns 200 with history array', async () => {
    const prisma = createMockPrisma()
    prisma.material.findFirst.mockResolvedValue(mockMaterial)
    prisma.materialPriceHistory.findMany.mockResolvedValue([mockHistory])
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/mat-1/price-history',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('returns 404 for unknown material', async () => {
    const prisma = createMockPrisma()
    prisma.material.findFirst.mockResolvedValue(null)
    const { app } = await buildApp(prisma)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/materials/missing/price-history',
      headers: { authorization: adminToken(app) },
    })
    expect(res.statusCode).toBe(404)
  })
})
