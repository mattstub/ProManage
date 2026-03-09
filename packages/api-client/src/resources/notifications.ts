import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type { ApiResponse, Notification } from '@promanage/core'

export interface ListNotificationsParams {
  page?: number
  perPage?: number
  unreadOnly?: boolean
}

export class NotificationsResource {
  constructor(private readonly client: ProManageClient) {}

  /** List own notifications (paginated). */
  async list(params?: ListNotificationsParams): Promise<PaginatedResult<Notification>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.unreadOnly) query.set('unreadOnly', 'true')

    const qs = query.toString()
    return this.client.request<PaginatedResult<Notification>>(
      `/api/v1/notifications${qs ? `?${qs}` : ''}`
    )
  }

  /** Get unread notification count. */
  async getUnreadCount(): Promise<number> {
    const res = await this.client.request<ApiResponse<{ count: number }>>(
      '/api/v1/notifications/unread-count'
    )
    return res.data.count
  }

  /** Mark a single notification as read. */
  async markRead(id: string): Promise<Notification> {
    const res = await this.client.request<ApiResponse<Notification>>(
      `/api/v1/notifications/${id}/read`,
      { method: 'PATCH' }
    )
    return res.data
  }

  /** Mark all notifications as read. Returns count of updated notifications. */
  async markAllRead(): Promise<number> {
    const res = await this.client.request<ApiResponse<{ count: number }>>(
      '/api/v1/notifications/read-all',
      { method: 'PATCH' }
    )
    return res.data.count
  }

  /** Delete a notification. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/notifications/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Returns the SSE stream URL for the given access token.
   * Use with EventSource: new EventSource(client.notifications.getStreamUrl(token))
   */
  getStreamUrl(baseUrl: string, token: string): string {
    return `${baseUrl}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`
  }
}
