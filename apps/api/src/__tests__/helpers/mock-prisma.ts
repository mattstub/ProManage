import { vi } from 'vitest'

/**
 * Creates a typed partial mock of PrismaClient covering only the models and
 * operations used by auth, project, and dashboard services. Add new model
 * mocks here as new services are introduced.
 *
 * Usage in tests:
 *   const prisma = createMockPrisma()
 *   prisma.user.findUnique.mockResolvedValue(mockUser)
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      create: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    project: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    calendarEvent: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    // $transaction can be called with either an array (batch) or a callback
    // (interactive). Tests should override the implementation per scenario.
    $transaction: vi.fn(),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>
