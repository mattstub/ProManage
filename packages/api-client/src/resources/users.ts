import type { ProManageClient } from '../client'
import type { PaginatedResult, PaginationParams } from '../types'
import type { User, UpdateUserInput, ApiResponse } from '@promanage/core'

export class UsersResource {
  constructor(private readonly client: ProManageClient) {}

  /**
   * List users in the current organization.
   * Requires Admin, ProjectManager, or OfficeAdmin role.
   */
  async list(params?: PaginationParams): Promise<PaginatedResult<User>> {
    const res = await this.client.request<ApiResponse<User[]>>('/api/v1/users', {
      params: {
        page: params?.page,
        perPage: params?.perPage,
      },
    })
    return {
      data: res.data,
      meta: res.meta!,
    }
  }

  /** Get a single user by ID (must belong to the same organization). */
  async get(id: string): Promise<User> {
    const res = await this.client.request<ApiResponse<User>>(
      `/api/v1/users/${id}`,
    )
    return res.data
  }

  /**
   * Update a user's profile.
   * Users can update themselves; Admins can update any user.
   */
  async update(id: string, body: UpdateUserInput): Promise<User> {
    const res = await this.client.request<ApiResponse<User>>(
      `/api/v1/users/${id}`,
      { method: 'PATCH', body },
    )
    return res.data
  }

  /**
   * Deactivate (soft-delete) a user.
   * Requires Admin role.
   */
  async deactivate(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/users/${id}`, {
      method: 'DELETE',
    })
  }
}
