export type EventType = 'MEETING' | 'MILESTONE' | 'INSPECTION' | 'DEADLINE' | 'OTHER'

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  startDate: Date
  endDate: Date
  allDay: boolean
  eventType: EventType
  organizationId: string
  projectId?: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface CalendarEventWithRelations extends CalendarEvent {
  project?: {
    id: string
    name: string
    number: string
  } | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateCalendarEventInput {
  title: string
  description?: string
  startDate: Date
  endDate: Date
  allDay?: boolean
  eventType?: EventType
  projectId?: string
}

export interface UpdateCalendarEventInput {
  title?: string
  description?: string | null
  startDate?: Date
  endDate?: Date
  allDay?: boolean
  eventType?: EventType
  projectId?: string | null
}
