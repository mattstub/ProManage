export interface UserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string | null
}

export interface ChannelPermission {
  id: string
  channelId: string
  roleName: string
  canRead: boolean
  canWrite: boolean
  canManage: boolean
}

export interface ChannelMember {
  channelId: string
  userId: string
  joinedAt: string
  user: UserSummary
}

export interface Channel {
  id: string
  organizationId: string
  name: string
  slug: string
  description?: string | null
  isPrivate: boolean
  projectId?: string | null
  createdAt: string
  updatedAt: string
}

export interface ChannelWithRelations extends Channel {
  members?: ChannelMember[]
  permissions?: ChannelPermission[]
  messageCount?: number
}

export interface MessageAttachment {
  id: string
  messageId: string
  filename: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  parentId?: string | null
  body: string
  editedAt?: string | null
  deletedAt?: string | null
  createdAt: string
}

export interface ChatMessageWithRelations extends ChatMessage {
  sender: UserSummary | null
  attachments: MessageAttachment[]
  replyCount?: number
}

export interface CreateChannelInput {
  name: string
  slug: string
  description?: string
  isPrivate?: boolean
  projectId?: string
}

export interface UpdateChannelInput {
  name?: string
  slug?: string
  description?: string
  isPrivate?: boolean
  projectId?: string
}

export interface SendChatMessageInput {
  body: string
  parentId?: string
}

export interface UpdateChannelPermissionInput {
  roleName: string
  canRead?: boolean
  canWrite?: boolean
  canManage?: boolean
}
