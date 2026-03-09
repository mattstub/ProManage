export type NotificationType = 'TASK_ASSIGNED' | 'INFO'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  entityId?: string | null
  entityType?: string | null
  userId: string
  organizationId: string
  createdAt: Date
}

export interface CreateNotificationInput {
  userId: string
  organizationId: string
  title: string
  message: string
  type?: NotificationType
  entityId?: string
  entityType?: string
}
