import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  CreateProcedureInput,
  ProcedureStatus,
  ProcedureWithRelations,
  UpdateProcedureInput,
} from '@promanage/core'

export interface ListProceduresParams {
  page?: number
  perPage?: number
  status?: ProcedureStatus
  category?: string
  projectId?: string
}

export class ProceduresResource {
  constructor(private readonly client: ProManageClient) {}

  /** List procedures for the current organization (paginated). */
  async list(params?: ListProceduresParams): Promise<PaginatedResult<ProcedureWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.status) query.set('status', params.status)
    if (params?.category) query.set('category', params.category)
    if (params?.projectId) query.set('projectId', params.projectId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<ProcedureWithRelations>>(
      `/api/v1/procedures${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single procedure by ID. */
  async get(id: string): Promise<ProcedureWithRelations> {
    const res = await this.client.request<ApiResponse<ProcedureWithRelations>>(
      `/api/v1/procedures/${id}`
    )
    return res.data
  }

  /** Create a new procedure. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async create(body: CreateProcedureInput): Promise<ProcedureWithRelations> {
    const res = await this.client.request<ApiResponse<ProcedureWithRelations>>(
      '/api/v1/procedures',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a procedure. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async update(id: string, body: UpdateProcedureInput): Promise<ProcedureWithRelations> {
    const res = await this.client.request<ApiResponse<ProcedureWithRelations>>(
      `/api/v1/procedures/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a procedure. Requires Admin role. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/procedures/${id}`, {
      method: 'DELETE',
    })
  }
}
