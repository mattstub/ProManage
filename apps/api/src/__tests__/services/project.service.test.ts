import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ConflictError, NotFoundError } from '../../lib/errors'
import * as projectService from '../../services/project.service'
import { createMockPrisma } from '../helpers/mock-prisma'

import type { FastifyInstance } from 'fastify'

function buildMockFastify() {
  const prisma = createMockPrisma()
  return {
    fastify: { prisma } as unknown as FastifyInstance,
    prisma,
  }
}

const baseProject = {
  id: 'project-1',
  name: 'Downtown Office Renovation',
  number: 'PRJ-2026-001',
  type: 'Commercial',
  status: 'Active',
  description: null,
  address: null,
  startDate: null,
  endDate: null,
  ownerName: null,
  ownerPhone: null,
  ownerEmail: null,
  architectName: null,
  contractorLicense: null,
  permitNumber: null,
  budget: null,
  squareFootage: null,
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  scopes: [],
  settings: null,
  contactProjects: [],
  _count: { tasks: 0, incidentReports: 0, toolboxTalks: 0, channels: 0 },
}

const baseScope = {
  id: 'scope-1',
  name: 'Phase 1',
  description: null,
  status: 'Active',
  sequence: 0,
  startDate: null,
  endDate: null,
  budget: null,
  projectId: 'project-1',
  organizationId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const baseSettings = {
  id: 'settings-1',
  projectId: 'project-1',
  requireDailyReports: false,
  requireTimeTracking: false,
  enableSafetyModule: true,
  enableDocumentsModule: false,
  defaultView: 'dashboard',
  notifyOnIncident: true,
  notifyOnDailyReport: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── listProjects ─────────────────────────────────────────────────────────────

describe('projectService.listProjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated projects filtered by organizationId', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findMany.mockResolvedValue([baseProject])
    prisma.project.count.mockResolvedValue(1)

    const result = await projectService.listProjects(fastify, 'org-1', {})

    expect(result.projects).toHaveLength(1)
    expect(result.meta.total).toBe(1)
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } })
    )
  })

  it('filters by status when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    await projectService.listProjects(fastify, 'org-1', { status: 'Active' })

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', status: 'Active' },
      })
    )
  })

  it('filters by type when provided', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    await projectService.listProjects(fastify, 'org-1', { type: 'Commercial' })

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', type: 'Commercial' },
      })
    )
  })

  it('applies search filter across name and number', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    await projectService.listProjects(fastify, 'org-1', { search: 'downtown' })

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'downtown', mode: 'insensitive' } },
            { number: { contains: 'downtown', mode: 'insensitive' } },
          ],
        }),
      })
    )
  })

  it('returns empty array when no projects exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findMany.mockResolvedValue([])
    prisma.project.count.mockResolvedValue(0)

    const result = await projectService.listProjects(fastify, 'org-1', {})

    expect(result.projects).toHaveLength(0)
    expect(result.meta.total).toBe(0)
  })
})

// ─── getProject ───────────────────────────────────────────────────────────────

describe('projectService.getProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns project with relations when found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(baseProject)

    const result = await projectService.getProject(fastify, 'project-1', 'org-1')

    expect(result.id).toBe('project-1')
    expect(result.scopes).toEqual([])
    expect(result.contactProjects).toEqual([])
  })

  it('throws NotFoundError when project does not exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(projectService.getProject(fastify, 'missing', 'org-1')).rejects.toThrow(
      NotFoundError
    )
  })

  it('throws NotFoundError when project belongs to different org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(projectService.getProject(fastify, 'project-1', 'org-2')).rejects.toThrow(
      NotFoundError
    )
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'project-1', organizationId: 'org-2' } })
    )
  })
})

// ─── createProject ────────────────────────────────────────────────────────────

describe('projectService.createProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates project and settings in a transaction', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findUnique.mockResolvedValue(null)
    prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma)
    )
    prisma.project.create.mockResolvedValue({ id: 'project-new', ...baseProject })
    prisma.projectSettings.upsert.mockResolvedValue(baseSettings)
    prisma.project.findFirst.mockResolvedValue(baseProject)

    const input = { name: 'New Project', number: 'PRJ-NEW', type: 'Commercial' as const }
    const result = await projectService.createProject(fastify, 'org-1', input)

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(result.id).toBe('project-1')
  })

  it('throws ConflictError when project number already exists', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findUnique.mockResolvedValue(baseProject)

    await expect(
      projectService.createProject(fastify, 'org-1', {
        name: 'Dupe',
        number: 'PRJ-2026-001',
        type: 'Commercial',
      })
    ).rejects.toThrow(ConflictError)

    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

// ─── updateProject ────────────────────────────────────────────────────────────

describe('projectService.updateProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates project fields and returns with relations', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.project.update.mockResolvedValue(baseProject)

    await projectService.updateProject(fastify, 'project-1', 'org-1', { name: 'Updated Name' })

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'project-1' } })
    )
  })

  it('throws NotFoundError when project not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.updateProject(fastify, 'missing', 'org-1', { name: 'X' })
    ).rejects.toThrow(NotFoundError)
  })

  it('throws ConflictError on duplicate number', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst
      .mockResolvedValueOnce(baseProject) // getProject check passes
      .mockResolvedValueOnce({ id: 'other' }) // duplicate number check
    prisma.project.findFirst.mockResolvedValue(baseProject)

    // First call (getProject) returns project, second call (duplicate check) returns another project
    prisma.project.findFirst
      .mockResolvedValueOnce(baseProject)
      .mockResolvedValueOnce({ id: 'other-project', number: 'PRJ-2026-001', organizationId: 'org-1' })

    await expect(
      projectService.updateProject(fastify, 'project-1', 'org-1', { number: 'PRJ-2026-001' })
    ).rejects.toThrow(ConflictError)
  })
})

// ─── archiveProject ───────────────────────────────────────────────────────────

describe('projectService.archiveProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets project status to Closed', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.project.update.mockResolvedValue({ ...baseProject, status: 'Closed' })

    await projectService.archiveProject(fastify, 'project-1', 'org-1')

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'Closed' },
    })
  })

  it('throws NotFoundError when project not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(projectService.archiveProject(fastify, 'missing', 'org-1')).rejects.toThrow(
      NotFoundError
    )
  })
})

// ─── getProjectDashboard ──────────────────────────────────────────────────────

describe('projectService.getProjectDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns dashboard with aggregated metrics', async () => {
    const { fastify, prisma } = buildMockFastify()
    const projectWithScopes = {
      ...baseProject,
      scopes: [{ id: 'scope-1', name: 'Phase 1', status: 'Active' }],
      contactProjects: [{ assignedAt: new Date(), role: null, contact: {} }],
    }
    prisma.project.findFirst.mockResolvedValue(projectWithScopes)
    prisma.task.count.mockResolvedValueOnce(3).mockResolvedValueOnce(1)
    prisma.incidentReport.count.mockResolvedValue(0)
    prisma.calendarEvent.count.mockResolvedValue(2)
    prisma.toolboxTalk.count.mockResolvedValue(1)

    const result = await projectService.getProjectDashboard(fastify, 'project-1', 'org-1')

    expect(result.metrics.openTaskCount).toBe(3)
    expect(result.metrics.overdueTaskCount).toBe(1)
    expect(result.metrics.openIncidentCount).toBe(0)
    expect(result.metrics.upcomingEventsCount).toBe(2)
    expect(result.metrics.scheduledToolboxTalksCount).toBe(1)
    expect(result.metrics.activeContactCount).toBe(1)
    expect(result.metrics.scopeProgress).toHaveLength(1)
    expect(result.metrics.scopeProgress[0].scopeName).toBe('Phase 1')
  })

  it('throws NotFoundError when project not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.getProjectDashboard(fastify, 'missing', 'org-1')
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── Contact assignment ───────────────────────────────────────────────────────

describe('projectService.listProjectContacts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns contact assignments for a project', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(baseProject)
    prisma.contactProject.findMany.mockResolvedValue([
      { assignedAt: new Date(), role: 'Electrician', contact: { id: 'c-1', firstName: 'Bob' } },
    ])

    const result = await projectService.listProjectContacts(fastify, 'project-1', 'org-1')

    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('Electrician')
  })

  it('throws NotFoundError when project not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.listProjectContacts(fastify, 'missing', 'org-1')
    ).rejects.toThrow(NotFoundError)
  })
})

describe('projectService.assignContactToProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a ContactProject association with role', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' })
    prisma.contactProject.upsert.mockResolvedValue({})

    await projectService.assignContactToProject(
      fastify,
      'project-1',
      'contact-1',
      'org-1',
      { role: 'Site Superintendent' }
    )

    expect(prisma.contactProject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { contactId: 'contact-1', projectId: 'project-1', role: 'Site Superintendent' },
        update: { role: 'Site Superintendent' },
      })
    )
  })

  it('throws NotFoundError when project not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.assignContactToProject(fastify, 'missing', 'c-1', 'org-1', {})
    ).rejects.toThrow(NotFoundError)
  })

  it('throws NotFoundError when contact not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue(null)

    await expect(
      projectService.assignContactToProject(fastify, 'project-1', 'missing', 'org-1', {})
    ).rejects.toThrow(NotFoundError)
  })
})

describe('projectService.removeContactFromProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes ContactProject association', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.contact.findFirst.mockResolvedValue({ id: 'contact-1' })
    prisma.contactProject.delete.mockResolvedValue({})

    await projectService.removeContactFromProject(fastify, 'project-1', 'contact-1', 'org-1')

    expect(prisma.contactProject.delete).toHaveBeenCalledWith({
      where: { contactId_projectId: { contactId: 'contact-1', projectId: 'project-1' } },
    })
  })

  it('throws NotFoundError when project not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.removeContactFromProject(fastify, 'missing', 'c-1', 'org-1')
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── Scopes ───────────────────────────────────────────────────────────────────

describe('projectService.createProjectScope', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates scope with correct fields', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectScope.create.mockResolvedValue(baseScope)

    const result = await projectService.createProjectScope(fastify, 'project-1', 'org-1', {
      name: 'Phase 1',
      status: 'Active',
      sequence: 0,
    })

    expect(result.name).toBe('Phase 1')
    expect(prisma.projectScope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ projectId: 'project-1', organizationId: 'org-1' }),
      })
    )
  })

  it('throws NotFoundError when project not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.createProjectScope(fastify, 'missing', 'org-1', { name: 'X', status: 'Active', sequence: 0 })
    ).rejects.toThrow(NotFoundError)
  })
})

describe('projectService.updateProjectScope', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates scope fields', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.projectScope.findFirst.mockResolvedValue(baseScope)
    prisma.projectScope.update.mockResolvedValue({ ...baseScope, name: 'Phase 1 Updated' })

    const result = await projectService.updateProjectScope(
      fastify,
      'scope-1',
      'project-1',
      'org-1',
      { name: 'Phase 1 Updated' }
    )

    expect(result.name).toBe('Phase 1 Updated')
  })

  it('throws NotFoundError when scope not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.projectScope.findFirst.mockResolvedValue(null)

    await expect(
      projectService.updateProjectScope(fastify, 'missing', 'project-1', 'org-1', {})
    ).rejects.toThrow(NotFoundError)
  })
})

describe('projectService.deleteProjectScope', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes scope', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.projectScope.findFirst.mockResolvedValue(baseScope)
    prisma.projectScope.delete.mockResolvedValue(baseScope)

    await projectService.deleteProjectScope(fastify, 'scope-1', 'project-1', 'org-1')

    expect(prisma.projectScope.delete).toHaveBeenCalledWith({ where: { id: 'scope-1' } })
  })

  it('throws NotFoundError when scope not found', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.projectScope.findFirst.mockResolvedValue(null)

    await expect(
      projectService.deleteProjectScope(fastify, 'missing', 'project-1', 'org-1')
    ).rejects.toThrow(NotFoundError)
  })
})

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('projectService.getProjectSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns settings, creating defaults if none exist', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectSettings.upsert.mockResolvedValue(baseSettings)

    const result = await projectService.getProjectSettings(fastify, 'project-1', 'org-1')

    expect(result.enableSafetyModule).toBe(true)
    expect(prisma.projectSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: 'project-1' } })
    )
  })

  it('throws NotFoundError when project not in org', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue(null)

    await expect(
      projectService.getProjectSettings(fastify, 'missing', 'org-1')
    ).rejects.toThrow(NotFoundError)
  })
})

describe('projectService.updateProjectSettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts settings with provided values', async () => {
    const { fastify, prisma } = buildMockFastify()
    prisma.project.findFirst.mockResolvedValue({ id: 'project-1' })
    prisma.projectSettings.upsert.mockResolvedValue({
      ...baseSettings,
      requireDailyReports: true,
    })

    const result = await projectService.updateProjectSettings(fastify, 'project-1', 'org-1', {
      requireDailyReports: true,
    })

    expect(result.requireDailyReports).toBe(true)
    expect(prisma.projectSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { requireDailyReports: true },
      })
    )
  })
})
