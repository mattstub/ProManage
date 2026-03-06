import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  CreateTaskInput,
  TaskStatus,
  TaskWithRelations,
  UpdateTaskInput,
} from '@promanage/core'

export interface ListTasksParams {
  page?: number
  perPage?: number
  status?: TaskStatus
  assigneeId?: string
  projectId?: string
}

export class TasksResource {
  constructor(private readonly client: ProManageClient) {}

  /** List tasks for the current organization (paginated). */
  async list(params?: ListTasksParams): Promise<PaginatedResult<TaskWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.status) query.set('status', params.status)
    if (params?.assigneeId) query.set('assigneeId', params.assigneeId)
    if (params?.projectId) query.set('projectId', params.projectId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<TaskWithRelations>>(
      `/api/v1/tasks${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single task by ID. */
  async get(id: string): Promise<TaskWithRelations> {
    const res = await this.client.request<ApiResponse<TaskWithRelations>>(
      `/api/v1/tasks/${id}`
    )
    return res.data
  }

  /** Create a new task. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async create(body: CreateTaskInput): Promise<TaskWithRelations> {
    const res = await this.client.request<ApiResponse<TaskWithRelations>>(
      '/api/v1/tasks',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a task. Requires Admin, ProjectManager, OfficeAdmin role, or be the assignee. */
  async update(id: string, body: UpdateTaskInput): Promise<TaskWithRelations> {
    const res = await this.client.request<ApiResponse<TaskWithRelations>>(
      `/api/v1/tasks/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a task. Requires Admin role. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/tasks/${id}`, {
      method: 'DELETE',
    })
  }
}
