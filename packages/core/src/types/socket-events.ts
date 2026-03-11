import type { ChatMessageWithRelations } from './channel'

export interface ChannelMessageEvent extends ChatMessageWithRelations {
  channelId: string
}

export interface ChannelMessageEditedEvent {
  messageId: string
  channelId: string
  body: string
  editedAt: string
}

export interface ChannelMessageDeletedEvent {
  messageId: string
  channelId: string
}

export interface ChannelMemberJoinedEvent {
  channelId: string
  userId: string
}

export interface ChannelMemberLeftEvent {
  channelId: string
  userId: string
}

export type ChannelSocketEvent =
  | { event: 'channel:message'; data: ChannelMessageEvent }
  | { event: 'channel:message:edited'; data: ChannelMessageEditedEvent }
  | { event: 'channel:message:deleted'; data: ChannelMessageDeletedEvent }
  | { event: 'channel:member:joined'; data: ChannelMemberJoinedEvent }
  | { event: 'channel:member:left'; data: ChannelMemberLeftEvent }
