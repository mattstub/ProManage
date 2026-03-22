import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  Channel,
  ChannelPermission,
  ChannelWithRelations,
  ChatMessageWithRelations,
  CreateChannelInput,
  MessageAttachment,
  SendChatMessageInput,
  UpdateChannelInput,
  UpdateChannelPermissionInput,
} from '@promanage/core'

export interface ListChannelMessagesParams {
  page?: number
  perPage?: number
  parentId?: string
}

export class ChannelsResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Channels ───────────────────────────────────────────────────────────────

  /** List all channels visible to the current user. Pass `projectId` to filter to a specific project. */
  async list(params?: { projectId?: string }): Promise<Channel[]> {
    const qs = params?.projectId ? `?projectId=${params.projectId}` : ''
    const res = await this.client.request<{ data: Channel[] }>(`/api/v1/channels${qs}`)
    return res.data
  }

  /** Create a new channel. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async create(body: CreateChannelInput): Promise<ChannelWithRelations> {
    const res = await this.client.request<{ data: ChannelWithRelations }>('/api/v1/channels', {
      method: 'POST',
      body,
    })
    return res.data
  }

  /** Get a single channel by ID. */
  async get(channelId: string): Promise<ChannelWithRelations> {
    const res = await this.client.request<{ data: ChannelWithRelations }>(
      `/api/v1/channels/${channelId}`
    )
    return res.data
  }

  /** Update a channel's name, description, or other settings. */
  async update(channelId: string, body: UpdateChannelInput): Promise<ChannelWithRelations> {
    const res = await this.client.request<{ data: ChannelWithRelations }>(
      `/api/v1/channels/${channelId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a channel. Requires Admin, ProjectManager, or OfficeAdmin role. */
  async delete(channelId: string): Promise<void> {
    await this.client.request<void>(`/api/v1/channels/${channelId}`, { method: 'DELETE' })
  }

  // ─── Permissions ────────────────────────────────────────────────────────────

  /** List per-role permissions for a channel. */
  async listPermissions(channelId: string): Promise<ChannelPermission[]> {
    const res = await this.client.request<{ data: ChannelPermission[] }>(
      `/api/v1/channels/${channelId}/permissions`
    )
    return res.data
  }

  /** Set (upsert) the read/write/manage permissions for a role on a channel. */
  async updatePermission(
    channelId: string,
    body: UpdateChannelPermissionInput
  ): Promise<ChannelPermission> {
    const res = await this.client.request<{ data: ChannelPermission }>(
      `/api/v1/channels/${channelId}/permissions`,
      { method: 'PUT', body }
    )
    return res.data
  }

  // ─── Membership ─────────────────────────────────────────────────────────────

  /** Join a channel (adds current user as a member). */
  async join(channelId: string): Promise<void> {
    await this.client.request<void>(`/api/v1/channels/${channelId}/join`, { method: 'POST' })
  }

  /** Leave a channel (removes current user from membership). */
  async leave(channelId: string): Promise<void> {
    await this.client.request<void>(`/api/v1/channels/${channelId}/leave`, { method: 'POST' })
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  /** List messages in a channel, optionally filtered to a thread by parentId. */
  async listMessages(
    channelId: string,
    params?: ListChannelMessagesParams
  ): Promise<PaginatedResult<ChatMessageWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.parentId) query.set('parentId', params.parentId)
    const qs = query.toString()
    return this.client.request<PaginatedResult<ChatMessageWithRelations>>(
      `/api/v1/channels/${channelId}/messages${qs ? `?${qs}` : ''}`
    )
  }

  /** Send a message to a channel. Optionally set parentId to reply in a thread. */
  async sendMessage(
    channelId: string,
    body: SendChatMessageInput
  ): Promise<ChatMessageWithRelations> {
    const res = await this.client.request<{ data: ChatMessageWithRelations }>(
      `/api/v1/channels/${channelId}/messages`,
      { method: 'POST', body }
    )
    return res.data
  }

  /** Edit a message body. Only the original sender can edit. */
  async editMessage(
    channelId: string,
    messageId: string,
    body: string
  ): Promise<ChatMessageWithRelations> {
    const res = await this.client.request<{ data: ChatMessageWithRelations }>(
      `/api/v1/channels/${channelId}/messages/${messageId}`,
      { method: 'PATCH', body: { body } }
    )
    return res.data
  }

  /** Soft-delete a message. Sender or channel managers can delete. */
  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/channels/${channelId}/messages/${messageId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Attachments ────────────────────────────────────────────────────────────

  /** Get a presigned upload URL for a file attachment. Upload directly to the returned URL, then call confirmAttachment. */
  async getUploadUrl(
    channelId: string,
    file: { filename: string; mimeType: string; sizeBytes: number }
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const res = await this.client.request<{ data: { uploadUrl: string; storageKey: string } }>(
      `/api/v1/channels/${channelId}/attachments/upload-url`,
      { method: 'POST', body: file }
    )
    return res.data
  }

  /** Confirm an attachment after the file has been uploaded to the presigned URL. */
  async confirmAttachment(
    channelId: string,
    messageId: string,
    data: { filename: string; mimeType: string; sizeBytes: number; storageKey: string }
  ): Promise<MessageAttachment> {
    const res = await this.client.request<{ data: MessageAttachment }>(
      `/api/v1/channels/${channelId}/messages/${messageId}/attachments`,
      { method: 'POST', body: data }
    )
    return res.data
  }

  /** Get a presigned download URL for an attachment (expires in 1 hour). */
  async getDownloadUrl(
    channelId: string,
    attachmentId: string
  ): Promise<{ downloadUrl: string }> {
    const res = await this.client.request<{ data: { downloadUrl: string } }>(
      `/api/v1/channels/${channelId}/attachments/${attachmentId}/download-url`
    )
    return res.data
  }
}
