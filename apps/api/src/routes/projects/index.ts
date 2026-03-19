import {
  assignContactToProjectSchema,
  createProjectSchema,
  createProjectScopeSchema,
  updateProjectSchema,
  updateProjectScopeSchema,
  updateProjectSettingsSchema,
} from '@promanage/core'

import { RATE_LIMITS } from '../../lib/rate-limit'
import { setupRateLimit } from '../../lib/rate-limit-setup'
import { created, noContent, paginated, success } from '../../lib/response'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/authorize'
import * as projectService from '../../services/project.service'

import type { ProjectStatus, ProjectType } from '@promanage/core'
import type { FastifyPluginAsync } from 'fastify'

const WRITE_ROLES = ['Admin', 'ProjectManager'] as const
const SETTINGS_ROLES = ['Admin', 'ProjectManager'] as const

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  await setupRateLimit(fastify)

  const readRateLimiter = fastify.rateLimit(RATE_LIMITS.READ)
  const writeRateLimiter = fastify.rateLimit(RATE_LIMITS.WRITE)
  const sensitiveRateLimiter = fastify.rateLimit(RATE_LIMITS.SENSITIVE)

  // ─── Project CRUD ────────────────────────────────────────────────────────────

  // GET /projects
  fastify.get(
    '/',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const query = request.query as {
        page?: string
        perPage?: string
        status?: ProjectStatus
        type?: ProjectType
        search?: string
      }
      const { projects, meta } = await projectService.listProjects(
        fastify,
        request.user.organizationId,
        query
      )
      return paginated(reply, projects, meta)
    }
  )

  // GET /projects/:id
  fastify.get(
    '/:id',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const project = await projectService.getProject(fastify, id, request.user.organizationId)
      return success(reply, project)
    }
  )

  // POST /projects — Admin, ProjectManager only
  fastify.post(
    '/',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const input = createProjectSchema.parse(request.body)
      const project = await projectService.createProject(fastify, request.user.organizationId, input)
      return created(reply, project)
    }
  )

  // PATCH /projects/:id — Admin, ProjectManager only
  fastify.patch(
    '/:id',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateProjectSchema.parse(request.body)
      const project = await projectService.updateProject(fastify, id, request.user.organizationId, input)
      return success(reply, project)
    }
  )

  // DELETE /projects/:id — Admin only (archives)
  fastify.delete(
    '/:id',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole('Admin')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      await projectService.archiveProject(fastify, id, request.user.organizationId)
      return noContent(reply)
    }
  )

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  // GET /projects/:id/dashboard
  fastify.get(
    '/:id/dashboard',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const dashboard = await projectService.getProjectDashboard(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, dashboard)
    }
  )

  // ─── Team (ContactProject) ───────────────────────────────────────────────────

  // GET /projects/:id/contacts
  fastify.get(
    '/:id/contacts',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const contacts = await projectService.listProjectContacts(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, contacts)
    }
  )

  // POST /projects/:id/contacts/:contactId — Admin, PM only
  fastify.post(
    '/:id/contacts/:contactId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, contactId } = request.params as { id: string; contactId: string }
      const input = assignContactToProjectSchema.parse(request.body ?? {})
      await projectService.assignContactToProject(
        fastify,
        id,
        contactId,
        request.user.organizationId,
        input
      )
      return noContent(reply)
    }
  )

  // PATCH /projects/:id/contacts/:contactId — update role only
  fastify.patch(
    '/:id/contacts/:contactId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, contactId } = request.params as { id: string; contactId: string }
      const input = assignContactToProjectSchema.parse(request.body ?? {})
      await projectService.assignContactToProject(
        fastify,
        id,
        contactId,
        request.user.organizationId,
        input
      )
      return noContent(reply)
    }
  )

  // DELETE /projects/:id/contacts/:contactId — Admin, PM only
  fastify.delete(
    '/:id/contacts/:contactId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, contactId } = request.params as { id: string; contactId: string }
      await projectService.removeContactFromProject(
        fastify,
        id,
        contactId,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Scopes ──────────────────────────────────────────────────────────────────

  // GET /projects/:id/scopes
  fastify.get(
    '/:id/scopes',
    { preHandler: [readRateLimiter, authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const scopes = await projectService.listProjectScopes(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, scopes)
    }
  )

  // POST /projects/:id/scopes — Admin, PM only
  fastify.post(
    '/:id/scopes',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = createProjectScopeSchema.parse(request.body)
      const scope = await projectService.createProjectScope(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return created(reply, scope)
    }
  )

  // PATCH /projects/:id/scopes/:scopeId — Admin, PM only
  fastify.patch(
    '/:id/scopes/:scopeId',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, scopeId } = request.params as { id: string; scopeId: string }
      const input = updateProjectScopeSchema.parse(request.body)
      const scope = await projectService.updateProjectScope(
        fastify,
        scopeId,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, scope)
    }
  )

  // DELETE /projects/:id/scopes/:scopeId — Admin, PM only
  fastify.delete(
    '/:id/scopes/:scopeId',
    { preHandler: [sensitiveRateLimiter, authenticate, requireRole(...WRITE_ROLES)] },
    async (request, reply) => {
      const { id, scopeId } = request.params as { id: string; scopeId: string }
      await projectService.deleteProjectScope(
        fastify,
        scopeId,
        id,
        request.user.organizationId
      )
      return noContent(reply)
    }
  )

  // ─── Settings ────────────────────────────────────────────────────────────────

  // GET /projects/:id/settings — Admin, PM only
  fastify.get(
    '/:id/settings',
    { preHandler: [readRateLimiter, authenticate, requireRole(...SETTINGS_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const settings = await projectService.getProjectSettings(
        fastify,
        id,
        request.user.organizationId
      )
      return success(reply, settings)
    }
  )

  // PATCH /projects/:id/settings — Admin, PM only
  fastify.patch(
    '/:id/settings',
    { preHandler: [writeRateLimiter, authenticate, requireRole(...SETTINGS_ROLES)] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const input = updateProjectSettingsSchema.parse(request.body)
      const settings = await projectService.updateProjectSettings(
        fastify,
        id,
        request.user.organizationId,
        input
      )
      return success(reply, settings)
    }
  )
}

export default projectRoutes
