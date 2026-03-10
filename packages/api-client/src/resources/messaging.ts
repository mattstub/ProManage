import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  Announcement,
  AnnouncementWithRelations,
  ConversationWithRelations,
  CreateAnnouncementInput,
  DirectMessageWithSender,
  SendDirectMessageInput,
  UnreadCount,
  UpdateAnnouncementInput,
} from '@promanage/core'

export interface ListConversationsParams {
  page?: number
  perPage?: number
}

export interface ListMessagesParams {
  page?: number
  perPage?: number
}

export interface ListAnnouncementsParams {
  page?: number
  perPage?: number
}

export class MessagingResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Unread Count ───────────────────────────────────────────────────────────

  /** Get total unread count (DMs + announcements) for the current user. */
  async getUnreadCount(): Promise<UnreadCount> {
    const res = await this.client.request<{ data: UnreadCount }>('/api/v1/messages/unread-count')
    return res.data
  }

  // ─── Direct Messages ────────────────────────────────────────────────────────

  /** List conversations for the current user, ordered by most recent activity. */
  async listConversations(
    params?: ListConversationsParams
  ): Promise<PaginatedResult<ConversationWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    const qs = query.toString()
    return this.client.request<PaginatedResult<ConversationWithRelations>>(
      `/api/v1/messages/conversations${qs ? `?${qs}` : ''}`
    )
  }

  /** Start or resume a conversation with another user and send the first message. */
  async startConversation(
    otherUserId: string,
    body: SendDirectMessageInput
  ): Promise<{ conversation: ConversationWithRelations; message: DirectMessageWithSender }> {
    const res = await this.client.request<{
      data: { conversation: ConversationWithRelations; message: DirectMessageWithSender }
    }>(`/api/v1/messages/conversations/${otherUserId}`, { method: 'POST', body })
    return res.data
  }

  /** Get messages in a conversation thread (paginated, oldest first). */
  async listMessages(
    conversationId: string,
    params?: ListMessagesParams
  ): Promise<PaginatedResult<DirectMessageWithSender>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    const qs = query.toString()
    return this.client.request<PaginatedResult<DirectMessageWithSender>>(
      `/api/v1/messages/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`
    )
  }

  /** Send a message in an existing conversation. */
  async sendMessage(
    conversationId: string,
    body: SendDirectMessageInput
  ): Promise<DirectMessageWithSender> {
    const res = await this.client.request<{ data: DirectMessageWithSender }>(
      `/api/v1/messages/conversations/${conversationId}/messages`,
      { method: 'POST', body }
    )
    return res.data
  }

  // ─── Announcements ──────────────────────────────────────────────────────────

  /** List sent announcements visible to the current user. */
  async listAnnouncements(
    params?: ListAnnouncementsParams
  ): Promise<PaginatedResult<AnnouncementWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    const qs = query.toString()
    return this.client.request<PaginatedResult<AnnouncementWithRelations>>(
      `/api/v1/messages/announcements${qs ? `?${qs}` : ''}`
    )
  }

  /** List draft and scheduled announcements (Admin/PM/OfficeAdmin only). */
  async listDrafts(): Promise<Announcement[]> {
    const res = await this.client.request<{ data: Announcement[] }>(
      '/api/v1/messages/announcements/drafts'
    )
    return res.data
  }

  /** Get a single announcement by ID. */
  async getAnnouncement(id: string): Promise<AnnouncementWithRelations> {
    const res = await this.client.request<{ data: AnnouncementWithRelations }>(
      `/api/v1/messages/announcements/${id}`
    )
    return res.data
  }

  /** Create an announcement. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async createAnnouncement(body: CreateAnnouncementInput): Promise<Announcement> {
    const res = await this.client.request<{ data: Announcement }>(
      '/api/v1/messages/announcements',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a draft or scheduled announcement. */
  async updateAnnouncement(id: string, body: UpdateAnnouncementInput): Promise<Announcement> {
    const res = await this.client.request<{ data: Announcement }>(
      `/api/v1/messages/announcements/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a draft announcement (cannot delete sent announcements). */
  async deleteAnnouncement(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/messages/announcements/${id}`, {
      method: 'DELETE',
    })
  }

  /** Mark an announcement as read for the current user. */
  async markAnnouncementRead(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/messages/announcements/${id}/read`, {
      method: 'POST',
    })
  }
}
