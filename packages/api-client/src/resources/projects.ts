import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  CreateProjectInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from '@promanage/core'

export interface ListProjectsParams {
  page?: number
  perPage?: number
  status?: ProjectStatus
}

export class ProjectsResource {
  constructor(private readonly client: ProManageClient) {}

  /** List projects for the current organization (paginated). */
  async list(params?: ListProjectsParams): Promise<PaginatedResult<Project>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.status) query.set('status', params.status)

    const qs = query.toString()
    return this.client.request<PaginatedResult<Project>>(
      `/api/v1/projects${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single project by ID. */
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
}
