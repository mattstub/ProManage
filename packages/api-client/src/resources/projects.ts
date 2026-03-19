import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  AssignContactToProjectInput,
  CreateProjectInput,
  CreateProjectScopeInput,
  Project,
  ProjectContactAssignment,
  ProjectDashboard,
  ProjectScope,
  ProjectSettings,
  ProjectStatus,
  ProjectType,
  UpdateProjectInput,
  UpdateProjectScopeInput,
  UpdateProjectSettingsInput,
} from '@promanage/core'

export interface ListProjectsParams {
  page?: number
  perPage?: number
  status?: ProjectStatus
  type?: ProjectType
  search?: string
}

export class ProjectsResource {
  constructor(private readonly client: ProManageClient) {}

  /** List projects for the current organization (paginated). */
  async list(params?: ListProjectsParams): Promise<PaginatedResult<Project>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.status) query.set('status', params.status)
    if (params?.type) query.set('type', params.type)
    if (params?.search) query.set('search', params.search)

    const qs = query.toString()
    return this.client.request<PaginatedResult<Project>>(
      `/api/v1/projects${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single project by ID (includes scopes, settings, contacts). */
  async get(id: string): Promise<Project> {
    const res = await this.client.request<ApiResponse<Project>>(
      `/api/v1/projects/${id}`
    )
    return res.data
  }

  /** Create a new project. Requires Admin or ProjectManager role. */
  async create(body: CreateProjectInput): Promise<Project> {
    const res = await this.client.request<ApiResponse<Project>>(
      '/api/v1/projects',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a project. Requires Admin or ProjectManager role. */
  async update(id: string, body: UpdateProjectInput): Promise<Project> {
    const res = await this.client.request<ApiResponse<Project>>(
      `/api/v1/projects/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Archive a project (sets status to Closed). Requires Admin role. */
  async archive(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  /** Get dashboard metrics and recent activity for a project. */
  async getDashboard(id: string): Promise<ProjectDashboard> {
    const res = await this.client.request<ApiResponse<ProjectDashboard>>(
      `/api/v1/projects/${id}/dashboard`
    )
    return res.data
  }

  // ─── Team (ContactProject) ──────────────────────────────────────────────────

  /** List contacts (team members) assigned to a project. */
  async listContacts(id: string): Promise<ProjectContactAssignment[]> {
    const res = await this.client.request<ApiResponse<ProjectContactAssignment[]>>(
      `/api/v1/projects/${id}/contacts`
    )
    return res.data
  }

  /** Assign a contact to a project. Requires Admin or ProjectManager role. */
  async assignContact(
    id: string,
    contactId: string,
    body: AssignContactToProjectInput = {}
  ): Promise<void> {
    await this.client.request<void>(
      `/api/v1/projects/${id}/contacts/${contactId}`,
      { method: 'POST', body }
    )
  }

  /** Update a contact's role on a project. Requires Admin or ProjectManager role. */
  async updateContactAssignment(
    id: string,
    contactId: string,
    body: AssignContactToProjectInput
  ): Promise<void> {
    await this.client.request<void>(
      `/api/v1/projects/${id}/contacts/${contactId}`,
      { method: 'PATCH', body }
    )
  }

  /** Remove a contact from a project. Requires Admin or ProjectManager role. */
  async removeContact(id: string, contactId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/projects/${id}/contacts/${contactId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Scopes ─────────────────────────────────────────────────────────────────

  /** List all scopes for a project. */
  async listScopes(id: string): Promise<ProjectScope[]> {
    const res = await this.client.request<ApiResponse<ProjectScope[]>>(
      `/api/v1/projects/${id}/scopes`
    )
    return res.data
  }

  /** Create a scope for a project. Requires Admin or ProjectManager role. */
  async createScope(id: string, body: CreateProjectScopeInput): Promise<ProjectScope> {
    const res = await this.client.request<ApiResponse<ProjectScope>>(
      `/api/v1/projects/${id}/scopes`,
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a project scope. Requires Admin or ProjectManager role. */
  async updateScope(
    id: string,
    scopeId: string,
    body: UpdateProjectScopeInput
  ): Promise<ProjectScope> {
    const res = await this.client.request<ApiResponse<ProjectScope>>(
      `/api/v1/projects/${id}/scopes/${scopeId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a project scope. Requires Admin or ProjectManager role. */
  async deleteScope(id: string, scopeId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/projects/${id}/scopes/${scopeId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  /** Get project settings. Requires Admin or ProjectManager role. */
  async getSettings(id: string): Promise<ProjectSettings> {
    const res = await this.client.request<ApiResponse<ProjectSettings>>(
      `/api/v1/projects/${id}/settings`
    )
    return res.data
  }

  /** Update project settings. Requires Admin or ProjectManager role. */
  async updateSettings(id: string, body: UpdateProjectSettingsInput): Promise<ProjectSettings> {
    const res = await this.client.request<ApiResponse<ProjectSettings>>(
      `/api/v1/projects/${id}/settings`,
      { method: 'PATCH', body }
    )
    return res.data
  }
}
