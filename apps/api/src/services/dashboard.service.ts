import type { DashboardStats, ProjectStatus } from '@promanage/core'
import type { FastifyInstance } from 'fastify'

const PROJECT_STATUSES: ProjectStatus[] = [
  'Bidding',
  'PreConstruction',
  'Active',
  'OnHold',
  'Completed',
  'Closed',
]

export async function getDashboardStats(
  fastify: FastifyInstance,
  organizationId: string
): Promise<DashboardStats> {
  const [totalProjectCount, activeProjectCount, teamMemberCount, statusGroups] =
    await Promise.all([
      fastify.prisma.project.count({ where: { organizationId } }),
      fastify.prisma.project.count({ where: { organizationId, status: 'Active' } }),
      fastify.prisma.user.count({ where: { organizationId, isActive: true } }),
      fastify.prisma.project.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
    ])

  const projectsByStatus = PROJECT_STATUSES.reduce<Record<ProjectStatus, number>>(
    (acc, status) => {
      acc[status] = 0
      return acc
    },
    {} as Record<ProjectStatus, number>
  )

  for (const group of statusGroups) {
    projectsByStatus[group.status as ProjectStatus] = group._count._all
  }

  return {
    activeProjectCount,
    totalProjectCount,
    teamMemberCount,
    projectsByStatus,
  }
}
