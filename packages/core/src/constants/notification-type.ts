import type { NotificationType } from '../types/notification'

export const NOTIFICATION_TYPES: Record<NotificationType, { label: string }> = {
  TASK_ASSIGNED: { label: 'Task Assigned' },
  INFO: { label: 'Info' },
}

export const NOTIFICATION_TYPE_LIST: NotificationType[] = ['TASK_ASSIGNED', 'INFO']
