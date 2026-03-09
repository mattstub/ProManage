import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  CalendarEventWithRelations,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@promanage/core'

export interface ListCalendarEventsParams {
  page?: number
  perPage?: number
  startDate?: string
  endDate?: string
  projectId?: string
}

export class CalendarEventsResource {
  constructor(private readonly client: ProManageClient) {}

  /** List calendar events for the current organization (paginated, with optional date range). */
  async list(
    params?: ListCalendarEventsParams
  ): Promise<PaginatedResult<CalendarEventWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    if (params?.projectId) query.set('projectId', params.projectId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<CalendarEventWithRelations>>(
      `/api/v1/calendar-events${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single calendar event by ID. */
  async get(id: string): Promise<CalendarEventWithRelations> {
    const res = await this.client.request<ApiResponse<CalendarEventWithRelations>>(
      `/api/v1/calendar-events/${id}`
    )
    return res.data
  }

  /** Create a calendar event. Requires Admin, ProjectManager, OfficeAdmin, or Superintendent. */
  async create(body: CreateCalendarEventInput): Promise<CalendarEventWithRelations> {
    const res = await this.client.request<ApiResponse<CalendarEventWithRelations>>(
      '/api/v1/calendar-events',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a calendar event. Requires role or be the creator. */
  async update(id: string, body: UpdateCalendarEventInput): Promise<CalendarEventWithRelations> {
    const res = await this.client.request<ApiResponse<CalendarEventWithRelations>>(
      `/api/v1/calendar-events/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a calendar event. Requires Admin role or be the creator. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/calendar-events/${id}`, {
      method: 'DELETE',
    })
  }
}
