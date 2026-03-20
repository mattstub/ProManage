# Testing Guide

## Overview

ProManage uses **Vitest** for all automated testing. There are two tested packages:

| Package | Tests | What's covered |
| --- | --- | --- |
| `packages/core` | 97 | Zod schemas, utility functions |
| `apps/api` | 463 | Service business logic, HTTP route contracts |

There are no E2E tests, React component tests, or Playwright/Detox tests at this time.

---

## Running Tests

```bash
pnpm test                              # all packages via Turborepo
pnpm --filter @promanage/core test     # core unit tests only
pnpm --filter @promanage/api test      # API service + route tests only
```

---

## packages/core Tests

Test files live in `src/__tests__/`:

```
packages/core/src/__tests__/
├── schemas/        # One file per schema (e.g. project.test.ts)
└── utils/          # One file per util (e.g. pagination.test.ts)
```

### Schema Tests

Cover valid inputs, invalid inputs, boundary values, and type coercion.

```typescript
// src/__tests__/schemas/project.test.ts
import { describe, it, expect } from 'vitest'
import { createProjectSchema } from '../../schemas/project'

describe('createProjectSchema', () => {
  it('accepts valid input', () => {
    const result = createProjectSchema.safeParse({ name: 'Highway 45', type: 'COMMERCIAL' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = createProjectSchema.safeParse({ type: 'COMMERCIAL' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown type', () => {
    const result = createProjectSchema.safeParse({ name: 'Test', type: 'INVALID' })
    expect(result.success).toBe(false)
  })
})
```

### Util Tests

Cover all branches and edge cases (0, negative, max values).

```typescript
// src/__tests__/utils/pagination.test.ts
import { describe, it, expect } from 'vitest'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination'

describe('parsePagination', () => {
  it('returns defaults for empty input', () => {
    const result = parsePagination({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('clamps limit to maximum', () => {
    const result = parsePagination({ limit: '999' })
    expect(result.limit).toBeLessThanOrEqual(100)
  })

  it('clamps page to minimum of 1', () => {
    const result = parsePagination({ page: '0' })
    expect(result.page).toBe(1)
  })
})
```

---

## apps/api Tests

Test files live in `src/__tests__/`:

```
apps/api/src/__tests__/
├── helpers/
│   ├── build-app.ts      # buildXxxTestApp() per route group
│   ├── mock-prisma.ts     # createMockPrisma() factory
│   └── sign-test-token.ts # signTestToken() helper
├── services/              # One file per service
└── routes/                # One file per route group
```

### Mocking Infrastructure

**`createMockPrisma()`** — returns a Prisma client where every model method is a `vi.fn()`. When adding a new Prisma model, add its mock group here.

```typescript
import { createMockPrisma } from '../helpers/mock-prisma'

const prisma = createMockPrisma()

beforeEach(() => {
  vi.clearAllMocks()
})
```

**`buildXxxTestApp(prisma)`** — constructs a Fastify instance wired to the mock Prisma client. Add a new helper for each new route group.

```typescript
// helpers/build-app.ts
export async function buildProjectTestApp(prisma: MockPrisma) {
  const app = fastify()
  app.decorate('prisma', prisma)
  await app.register(projectRoutes, { prefix: '/api/v1' })
  return app
}
```

**`signTestToken(app, payload)`** — signs a JWT using the test app's secret. Use this in route tests instead of hardcoding tokens.

### Service Tests

Test business rules and error branches. Mock Prisma. Mock external services with `vi.mock()`.

```typescript
// src/__tests__/services/project.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockPrisma } from '../helpers/mock-prisma'
import { listProjects, getProject } from '../../services/project.service'

const prisma = createMockPrisma()

beforeEach(() => vi.clearAllMocks())

describe('listProjects', () => {
  it('scopes results to the organization', async () => {
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    await listProjects(prisma, 'org-1', {})

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-1' }) })
    )
  })
})

describe('getProject', () => {
  it('throws when project not found', async () => {
    prisma.project.findUnique.mockResolvedValue(null)
    await expect(getProject(prisma, 'org-1', 'bad-id')).rejects.toThrow()
  })
})
```

### Route Tests

Test HTTP contracts: status codes, response shape, auth requirements. Do not re-test service logic.

```typescript
// src/__tests__/routes/project.routes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildProjectTestApp } from '../helpers/build-app'
import { createMockPrisma } from '../helpers/mock-prisma'
import { signTestToken } from '../helpers/sign-test-token'

const prisma = createMockPrisma()
let app: FastifyInstance

// requireRole does a real DB lookup — seed it per test
function mockRole(role: string) {
  prisma.userRole.findMany.mockResolvedValue([{ role: { name: role } }])
}

beforeAll(async () => { app = await buildProjectTestApp(prisma) })
afterAll(() => app.close())
beforeEach(() => vi.clearAllMocks())

describe('GET /api/v1/projects', () => {
  it('returns 200 with data array', async () => {
    mockRole('Admin')
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    const token = signTestToken(app, { userId: 'u1', organizationId: 'org1', email: 'a@b.com' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('data')
  })

  it('returns 401 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/projects' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/v1/projects (Admin/PM only)', () => {
  it('returns 403 for FieldUser', async () => {
    mockRole('FieldUser')
    const token = signTestToken(app, { userId: 'u1', organizationId: 'org1', email: 'a@b.com' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Test', type: 'COMMERCIAL' },
    })
    expect(res.statusCode).toBe(403)
  })
})
```

### requireRole Pattern — CRITICAL

`requireRole` middleware performs a **real DB lookup** via `prisma.userRole.findMany`. Every test hitting a `requireRole`-protected endpoint must seed this mock — including tests that expect 403.

```typescript
// Happy path
mockRole('Admin')

// Test 403 enforcement
mockRole('FieldUser')

// If userRole.findMany is not seeded, requireRole returns 500 instead of 403
```

See `src/__tests__/routes/safety.routes.test.ts` as the reference implementation.

---

## What to Test at Each Layer

| Layer | Test | Don't test |
| --- | --- | --- |
| Service | Business rules, error branches (not found, wrong org, forbidden) | DB query internals — trust Prisma |
| Route | Status codes, response shape, cookie set/clear, auth required | Internal service logic |
| Schema | Constraints (regex, length, required), type coercion | Implementation details |
| Utils | Return values for all branches + edge cases (0, negative, max) | Library internals |

---

## Adding Tests for a New Feature

1. **New API route group** → add `buildXxxTestApp()` in `helpers/build-app.ts`
2. **New Prisma model** → add mock group in `helpers/mock-prisma.ts`
3. **New service** → `src/__tests__/services/[name].service.test.ts`
4. **New route group** → `src/__tests__/routes/[name].routes.test.ts`
5. **New core schema/util** → `packages/core/src/__tests__/schemas/` or `utils/`
6. **Tests ship with the feature** — not in a follow-up commit

---

**Last Updated**: 2026-03-19
