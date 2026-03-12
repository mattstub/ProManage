import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  ContactType,
  ContactWithRelations,
  CreateContactInput,
  UpdateContactInput,
} from '@promanage/core'

export interface ListContactsParams {
  page?: number
  perPage?: number
  type?: ContactType
  search?: string
}

export class ContactsResource {
  constructor(private readonly client: ProManageClient) {}

  /** List contacts for the current organization (paginated). */
  async list(params?: ListContactsParams): Promise<PaginatedResult<ContactWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.type) query.set('type', params.type)
    if (params?.search) query.set('search', params.search)

    const qs = query.toString()
    return this.client.request<PaginatedResult<ContactWithRelations>>(
      `/api/v1/contacts${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single contact by ID. */
  async get(id: string): Promise<ContactWithRelations> {
    const res = await this.client.request<ApiResponse<ContactWithRelations>>(
      `/api/v1/contacts/${id}`
    )
    return res.data
  }

  /** Create a new contact. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async create(body: CreateContactInput): Promise<ContactWithRelations> {
    const res = await this.client.request<ApiResponse<ContactWithRelations>>(
      '/api/v1/contacts',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a contact. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async update(id: string, body: UpdateContactInput): Promise<ContactWithRelations> {
    const res = await this.client.request<ApiResponse<ContactWithRelations>>(
      `/api/v1/contacts/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a contact. Requires Admin role. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/contacts/${id}`, { method: 'DELETE' })
  }

  /** Associate a contact with a project. Requires Admin or ProjectManager role. */
  async addToProject(contactId: string, projectId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/contacts/${contactId}/projects/${projectId}`,
      { method: 'POST' }
    )
  }

  /** Remove a contact's association with a project. Requires Admin or ProjectManager role. */
  async removeFromProject(contactId: string, projectId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/contacts/${contactId}/projects/${projectId}`,
      { method: 'DELETE' }
    )
  }
}
