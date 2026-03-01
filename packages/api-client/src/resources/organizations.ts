import type { ProManageClient } from '../client'
import type { Organization, UpdateOrganizationInput, ApiResponse } from '@promanage/core'

export class OrganizationsResource {
  constructor(private readonly client: ProManageClient) {}

  /** Get the current user's organization. */
  async getCurrent(): Promise<Organization> {
    const res = await this.client.request<ApiResponse<Organization>>(
      '/api/v1/organizations/current',
    )
    return res.data
  }

  /**
   * Update the current organization's details.
   * Requires Admin role.
   */
  async updateCurrent(body: UpdateOrganizationInput): Promise<Organization> {
    const res = await this.client.request<ApiResponse<Organization>>(
      '/api/v1/organizations/current',
      { method: 'PATCH', body },
    )
    return res.data
  }
}
