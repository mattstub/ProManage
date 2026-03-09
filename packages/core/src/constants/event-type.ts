import type { EventType } from '../types/calendar-event'

export const EVENT_TYPES: Record<EventType, { label: string; color: string }> = {
  MEETING: { label: 'Meeting', color: 'blue' },
  MILESTONE: { label: 'Milestone', color: 'purple' },
  INSPECTION: { label: 'Inspection', color: 'orange' },
  DEADLINE: { label: 'Deadline', color: 'red' },
  OTHER: { label: 'Other', color: 'gray' },
}

export const EVENT_TYPE_LIST: EventType[] = [
  'MEETING',
  'MILESTONE',
  'INSPECTION',
  'DEADLINE',
  'OTHER',
]
