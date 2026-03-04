import type { ProManageClient } from '../client'
import type { ApiResponse, DashboardStats } from '@promanage/core'

export class DashboardResource {
  constructor(private readonly client: ProManageClient) {}

  /** Get dashboard stats for the current organization. */
  async getStats(): Promise<DashboardStats> {
    const res = await this.client.request<ApiResponse<DashboardStats>>(
      '/api/v1/dashboard/stats'
    )
    return res.data
  }
}
