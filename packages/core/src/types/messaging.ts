export interface Conversation {
  id: string
  organizationId: string
  participantAId: string
  participantBId: string
  lastMessageAt: Date
  createdAt: Date
}

export interface ConversationWithRelations extends Conversation {
  participantA: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string | null
  }
  participantB: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string | null
  }
  latestMessage?: {
    body: string
    senderId: string
    createdAt: Date
  } | null
  unreadCount: number
}

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  readAt?: Date | null
  createdAt: Date
}

export interface DirectMessageWithSender extends DirectMessage {
  sender: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
}

export interface Announcement {
  id: string
  organizationId: string
  authorId: string
  subject: string
  body: string
  targetRole?: string | null
  scheduledAt?: Date | null
  sentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AnnouncementWithRelations extends Announcement {
  author: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
  isRead: boolean
}

export interface AnnouncementRead {
  announcementId: string
  userId: string
  readAt: Date
}

export interface SendDirectMessageInput {
  body: string
}

export interface CreateAnnouncementInput {
  subject: string
  body: string
  targetRole?: string
  scheduledAt?: Date
}

export interface UpdateAnnouncementInput {
  subject?: string
  body?: string
  targetRole?: string | null
  scheduledAt?: Date | null
}

export interface UnreadCount {
  directMessages: number
  announcements: number
  total: number
}
