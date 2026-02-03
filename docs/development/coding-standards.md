# Coding Standards

## Overview

This document outlines coding standards and best practices for ProManage. Consistency in code style improves readability, maintainability, and collaboration.

## General Principles

### Code Quality
- Write self-documenting code with clear naming
- Keep functions small and focused (single responsibility)
- Prefer composition over inheritance
- Don't repeat yourself (DRY)
- You aren't gonna need it (YAGNI) - don't over-engineer

### TypeScript First
- Always use TypeScript (never `.js` files in source)
- Avoid `any` type - use `unknown` if truly needed
- Prefer type inference when obvious
- Use explicit types for public APIs
- Leverage union types and type guards

### Code Review
- All code must be reviewed before merging
- Address feedback constructively
- Keep PRs focused and reasonably sized
- Write meaningful commit messages

## TypeScript

### Type Definitions

**Good:**
```typescript
interface User {
  id: string
  email: string
  role: UserRole
}

type UserRole = 'admin' | 'manager' | 'field_user'

function getUser(id: string): Promise<User | null> {
  // ...
}
```

**Bad:**
```typescript
function getUser(id: any): any {
  // ...
}
```

### Avoid `any`

**Good:**
```typescript
function processData(data: unknown): void {
  if (isValidData(data)) {
    // TypeScript knows data is ValidData here
    console.log(data.value)
  }
}
```

**Bad:**
```typescript
function processData(data: any): void {
  console.log(data.value)
}
```

### Use Type Guards

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}
```

### Prefer Interfaces for Objects

```typescript
// Use interface for object shapes
interface Project {
  id: string
  name: string
  status: ProjectStatus
}

// Use type for unions, primitives, etc.
type ProjectStatus = 'active' | 'completed' | 'archived'
type ID = string | number
```

## Naming Conventions

### Files & Folders

**Components** (PascalCase):
```
components/
  UserProfile.tsx
  ProjectCard.tsx
```

**Utilities** (kebab-case):
```
utils/
  format-date.ts
  calculate-budget.ts
```

**Hooks** (camelCase with `use` prefix):
```
hooks/
  useAuth.ts
  useProjects.ts
```

### Variables & Functions

**camelCase** for variables and functions:
```typescript
const userEmail = 'user@example.com'
const projectList = []

function calculateTotal(items: Item[]): number {
  // ...
}
```

**PascalCase** for classes and React components:
```typescript
class ProjectManager {
  // ...
}

function UserProfile() {
  return <div>...</div>
}
```

**UPPER_SNAKE_CASE** for constants:
```typescript
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
const API_BASE_URL = process.env.API_URL
```

### Boolean Variables

Prefix with `is`, `has`, `should`, etc.:
```typescript
const isLoading = true
const hasPermission = false
const shouldValidate = true
const canEdit = user.role === 'admin'
```

## React / Next.js

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/format-date'

// 2. Types/Interfaces
interface ProjectCardProps {
  project: Project
  onEdit?: (id: string) => void
}

// 3. Component
export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false)

  // Event handlers
  const handleEdit = () => {
    onEdit?.(project.id)
  }

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Functional Components

Always use functional components with hooks:

**Good:**
```typescript
export function UserProfile({ userId }: UserProfileProps) {
  const { data: user } = useUser(userId)
  return <div>{user?.name}</div>
}
```

**Bad:**
```typescript
export class UserProfile extends React.Component {
  // Don't use class components
}
```

### Props

**Destructure props:**
```typescript
// Good
function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// Bad
function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

**Use explicit types:**
```typescript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}
```

### Hooks

**Custom Hooks:**
```typescript
// hooks/useProjects.ts
export function useProjects(organizationId: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch projects
  }, [organizationId])

  return { projects, isLoading }
}
```

**Hook Dependencies:**
```typescript
// Good - explicit dependencies
useEffect(() => {
  fetchData(userId)
}, [userId])

// Bad - missing dependencies or empty array when not appropriate
useEffect(() => {
  fetchData(userId)
}, []) // userId is missing!
```

### State Management

**Local state** for component-specific data:
```typescript
const [isOpen, setIsOpen] = useState(false)
```

**Zustand** for global client state:
```typescript
// stores/auth-store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

**React Query** for server state:
```typescript
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })
}
```

## API / Backend

### Route Handlers

```typescript
// apps/api/src/routes/projects.ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /projects
  fastify.get('/projects', async (request, reply) => {
    const projects = await fastify.prisma.project.findMany()
    return projects
  })

  // POST /projects
  fastify.post('/projects', async (request, reply) => {
    const body = ProjectSchema.parse(request.body)
    const project = await fastify.prisma.project.create({
      data: body,
    })
    return reply.code(201).send(project)
  })
}
```

### Error Handling

```typescript
// Use custom error classes
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// Handle errors consistently
try {
  const project = await getProject(id)
  if (!project) {
    throw new NotFoundError('Project not found')
  }
  return project
} catch (error) {
  if (error instanceof NotFoundError) {
    return reply.code(404).send({ error: error.message })
  }
  throw error
}
```

### Validation

Use Zod for runtime validation:

```typescript
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  budget: z.number().positive(),
})

type CreateProjectInput = z.infer<typeof CreateProjectSchema>

function createProject(input: CreateProjectInput) {
  const validated = CreateProjectSchema.parse(input)
  // ...
}
```

## Database (Prisma)

### Schema

```prisma
// Use clear, descriptive names
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  budget      Decimal  @db.Decimal(10, 2)
  startDate   DateTime @map("start_date")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String       @map("organization_id")

  @@map("projects")
}
```

### Queries

```typescript
// Use typed Prisma client
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    organization: true,
    timeEntries: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
})

// Use transactions for multiple related operations
await prisma.$transaction([
  prisma.project.create({ data: projectData }),
  prisma.auditLog.create({ data: auditData }),
])
```

## Error Handling

### Frontend

```typescript
// Use error boundaries for React
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  // Implementation
}

// Handle async errors gracefully
async function handleSubmit() {
  try {
    await createProject(data)
    toast.success('Project created!')
  } catch (error) {
    if (error instanceof ValidationError) {
      toast.error(error.message)
    } else {
      toast.error('Something went wrong')
      console.error(error)
    }
  }
}
```

### Backend

```typescript
// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  // Log error
  request.log.error(error)

  // Return appropriate response
  if (error instanceof ValidationError) {
    return reply.code(400).send({ error: error.message })
  }

  if (error instanceof UnauthorizedError) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  // Default to 500
  return reply.code(500).send({ error: 'Internal Server Error' })
})
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTotal } from './calculate-total'

describe('calculateTotal', () => {
  it('should sum item prices', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ]
    expect(calculateTotal(items)).toBe(35)
  })

  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Comments

### When to Comment

**Good comments:**
```typescript
// Calculate discounted price with tax
// Formula: (price * (1 - discount)) * (1 + taxRate)
const total = calculatePriceWithTax(price, discount, taxRate)

// TODO: Optimize this query for large datasets
const projects = await fetchAllProjects()

// HACK: Workaround for Safari date parsing bug
const date = new Date(dateString.replace(/-/g, '/'))
```

**Bad comments (explain the obvious):**
```typescript
// Set user name to 'John'
const userName = 'John'

// Loop through projects
for (const project of projects) {
  // ...
}
```

### JSDoc for Public APIs

```typescript
/**
 * Calculate the total cost of a project including labor and materials
 * @param projectId - The unique project identifier
 * @param options - Calculation options
 * @returns Total cost in dollars
 * @throws {NotFoundError} If project doesn't exist
 */
export async function calculateProjectCost(
  projectId: string,
  options?: CostOptions
): Promise<number> {
  // ...
}
```

## Formatting

### Prettier Configuration

Handled automatically by Prettier (`.prettierrc`):
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### ESLint Configuration

Follow ESLint rules (`.eslintrc`). Key rules:
- No unused variables
- No console.log (use proper logging)
- Prefer const over let
- No var declarations

## Security

### Never Commit Secrets

```typescript
// Bad
const apiKey = 'sk_live_abc123'

// Good
const apiKey = process.env.API_KEY
```

### Sanitize User Input

```typescript
// Validate and sanitize
const email = EmailSchema.parse(input.email)

// Use parameterized queries (Prisma does this automatically)
await prisma.user.findUnique({ where: { email } })
```

### Authentication

```typescript
// Always verify authentication
export async function requireAuth(request: FastifyRequest) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new UnauthorizedError('No token provided')
  }

  const payload = verifyJWT(token)
  return payload
}
```

## Performance

### Avoid Unnecessary Re-renders

```typescript
// Use React.memo for expensive components
export const ProjectCard = React.memo(function ProjectCard({ project }: Props) {
  // ...
})

// Use useMemo for expensive calculations
const sortedProjects = useMemo(
  () => projects.sort((a, b) => a.name.localeCompare(b.name)),
  [projects]
)

// Use useCallback for event handlers passed as props
const handleEdit = useCallback(
  (id: string) => {
    editProject(id)
  },
  [editProject]
)
```

### Database Queries

```typescript
// Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
})

// Use pagination
const projects = await prisma.project.findMany({
  take: 20,
  skip: page * 20,
})
```

## Accessibility

### Semantic HTML

```typescript
// Good
<button onClick={handleClick}>Submit</button>
<nav>...</nav>
<main>...</main>

// Bad
<div onClick={handleClick}>Submit</div>
```

### ARIA Labels

```typescript
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation

```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>
```

## Import Organization

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal packages
import { Button } from '@promanage/ui-components'
import { formatDate } from '@promanage/core'

// 3. Relative imports (alphabetical)
import { useAuth } from '@/hooks/useAuth'
import { ProjectCard } from '@/components/ProjectCard'
import { api } from '@/lib/api'

// 4. Types
import type { Project } from '@/types'
```

## Git Commit Messages

See [git-workflow.md](git-workflow.md) for commit message guidelines.

---

**Last Updated**: 2026-02-02
**Status**: Living Document
