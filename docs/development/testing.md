# Testing Guide

## Overview

ProManage uses a multi-layered testing strategy to ensure code quality and prevent regressions.

## Testing Stack

### Unit & Integration Tests
- **Vitest**: Fast unit test runner
- **Testing Library**: React component testing
- **Supertest**: API endpoint testing

### E2E Tests
- **Playwright**: Web application E2E
- **Detox**: Mobile application E2E

### Code Coverage
- Minimum 80% coverage for business logic
- Minimum 60% coverage overall

## Running Tests

### All Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Specific Workspaces

```bash
# Test specific app/package
pnpm --filter @promanage/core test
pnpm --filter @promanage/web test
pnpm --filter @promanage/api test
```

### E2E Tests

```bash
# Web E2E
pnpm test:e2e

# Mobile E2E
cd apps/mobile
pnpm test:e2e:ios
pnpm test:e2e:android
```

## Unit Testing

### Writing Unit Tests

```typescript
// utils/calculate-total.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTotal } from './calculate-total'

describe('calculateTotal', () => {
  it('should sum item prices correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ]
    const result = calculateTotal(items)
    expect(result).toBe(35)
  })

  it('should handle empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('should handle decimal prices', () => {
    const items = [{ price: 10.5, quantity: 2 }]
    expect(calculateTotal(items)).toBe(21)
  })
})
```

### Test Structure

Use the **Arrange-Act-Assert** pattern:

```typescript
it('should update project status', async () => {
  // Arrange
  const project = createTestProject({ status: 'active' })

  // Act
  const updated = await updateProjectStatus(project.id, 'completed')

  // Assert
  expect(updated.status).toBe('completed')
})
```

### Mocking

```typescript
import { vi } from 'vitest'

// Mock modules
vi.mock('./api-client', () => ({
  fetchProjects: vi.fn(),
}))

// Mock functions
const mockFn = vi.fn()
mockFn.mockResolvedValue({ id: '1', name: 'Project' })
mockFn.mockRejectedValue(new Error('Failed'))

// Spy on functions
const spy = vi.spyOn(console, 'error')
expect(spy).toHaveBeenCalled()
```

## Component Testing

### React Components

```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should render with label', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should show loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
})
```

### Testing Hooks

```typescript
// hooks/useProjects.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'

describe('useProjects', () => {
  it('should fetch projects on mount', async () => {
    const { result } = renderHook(() => useProjects())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.projects).toHaveLength(3)
  })
})
```

### Query Testing (React Query)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useProjects', () => {
  it('should fetch and cache projects', async () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

## API Testing

### Endpoint Tests

```typescript
// routes/projects.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../app'
import type { FastifyInstance } from 'fastify'

describe('Projects API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /projects', () => {
    it('should return list of projects', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveProperty('data')
      expect(Array.isArray(response.json().data)).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /projects', () => {
    it('should create new project', async () => {
      const payload = {
        name: 'Test Project',
        description: 'Test description',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload,
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toMatchObject(payload)
    })

    it('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
```

### Database Tests

```typescript
import { PrismaClient } from '@prisma/client'
import { beforeEach, afterEach } from 'vitest'

const prisma = new PrismaClient()

beforeEach(async () => {
  // Clean database
  await prisma.$transaction([
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

afterEach(async () => {
  await prisma.$disconnect()
})

describe('Project repository', () => {
  it('should create project', async () => {
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        organizationId: 'test-org',
      },
    })

    expect(project.id).toBeDefined()
    expect(project.name).toBe('Test Project')
  })
})
```

## E2E Testing (Web)

### Playwright Tests

```typescript
// tests/e2e/projects.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create new project', async ({ page }) => {
    await page.goto('/projects')
    await page.click('button:has-text("New Project")')

    await page.fill('[name="name"]', 'E2E Test Project')
    await page.fill('[name="description"]', 'Test description')
    await page.click('button:has-text("Create")')

    await expect(page.locator('text=E2E Test Project')).toBeVisible()
  })

  test('should edit project', async ({ page }) => {
    await page.goto('/projects')
    await page.click('text=Test Project')

    await page.click('button:has-text("Edit")')
    await page.fill('[name="name"]', 'Updated Project')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Updated Project')).toBeVisible()
  })
})
```

### Page Object Pattern

```typescript
// tests/e2e/pages/projects.page.ts
export class ProjectsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/projects')
  }

  async createProject(name: string, description: string) {
    await this.page.click('button:has-text("New Project")')
    await this.page.fill('[name="name"]', name)
    await this.page.fill('[name="description"]', description)
    await this.page.click('button:has-text("Create")')
  }

  async getProjectByName(name: string) {
    return this.page.locator(`text=${name}`)
  }
}

// Usage in test
test('should create project', async ({ page }) => {
  const projectsPage = new ProjectsPage(page)
  await projectsPage.goto()
  await projectsPage.createProject('Test', 'Description')
  await expect(await projectsPage.getProjectByName('Test')).toBeVisible()
})
```

## Mobile Testing

See [mobile-testing.md](mobile-testing.md) for detailed mobile testing guide.

## Test Data

### Factories

```typescript
// tests/factories/project.factory.ts
import { faker } from '@faker-js/faker'
import type { Project } from '@prisma/client'

export function createTestProject(overrides?: Partial<Project>): Project {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    status: 'active',
    budget: faker.number.float({ min: 10000, max: 1000000 }),
    startDate: faker.date.past(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
```

### Fixtures

```typescript
// tests/fixtures/projects.json
[
  {
    "id": "project-1",
    "name": "Office Building Renovation",
    "status": "active",
    "budget": 250000
  },
  {
    "id": "project-2",
    "name": "Warehouse Construction",
    "status": "completed",
    "budget": 1500000
  }
]
```

## Coverage

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
})
```

## Best Practices

### Do's

- ✅ Write tests for all business logic
- ✅ Test edge cases and error conditions
- ✅ Use descriptive test names
- ✅ Keep tests simple and focused
- ✅ Use test factories for test data
- ✅ Mock external dependencies
- ✅ Test user behavior, not implementation details

### Don'ts

- ❌ Don't test third-party libraries
- ❌ Don't write tests just to increase coverage
- ❌ Don't test implementation details
- ❌ Don't use timeouts instead of proper async handling
- ❌ Don't write overly complex tests
- ❌ Don't share state between tests

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Debugging Tests

### VS Code

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--run"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Chrome DevTools

```bash
# Run with Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

---

**Last Updated**: 2026-02-02
**Status**: Complete
