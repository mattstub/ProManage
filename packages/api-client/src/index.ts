export { ProManageClient } from './client'
export { ApiClientError } from './errors'
export { AuthResource } from './resources/auth'
export { CalendarEventsResource } from './resources/calendar-events'
export { ChannelsResource } from './resources/channels'
export { ContactsResource } from './resources/contacts'
export { DashboardResource } from './resources/dashboard'
export { HealthResource } from './resources/health'
export { LicensesResource } from './resources/licenses'
export { MessagingResource } from './resources/messaging'
export { NotificationsResource } from './resources/notifications'
export { OrganizationsResource } from './resources/organizations'
export { ProceduresResource } from './resources/procedures'
export { ProjectsResource } from './resources/projects'
export { TasksResource } from './resources/tasks'
export { UsersResource } from './resources/users'

export type { ClientConfig, PaginatedResult, PaginationParams, RequestOptions } from './types'
export type { ListCalendarEventsParams } from './resources/calendar-events'
export type { ListContactsParams } from './resources/contacts'
export type { ListLicensesParams, LicenseReminderWithRelations } from './resources/licenses'
export type { ListChannelMessagesParams } from './resources/channels'
export type { HealthResponse } from './resources/health'
export type {
  ListAnnouncementsParams,
  ListConversationsParams,
  ListMessagesParams,
} from './resources/messaging'
export type { ListNotificationsParams } from './resources/notifications'
export type { ListProceduresParams } from './resources/procedures'
export type { ListProjectsParams } from './resources/projects'
export type { ListTasksParams } from './resources/tasks'

import { ProManageClient } from './client'
import { AuthResource } from './resources/auth'
import { CalendarEventsResource } from './resources/calendar-events'
import { ChannelsResource } from './resources/channels'
import { ContactsResource } from './resources/contacts'
import { DashboardResource } from './resources/dashboard'
import { HealthResource } from './resources/health'
import { LicensesResource } from './resources/licenses'
import { MessagingResource } from './resources/messaging'
import { NotificationsResource } from './resources/notifications'
import { OrganizationsResource } from './resources/organizations'
import { ProceduresResource } from './resources/procedures'
import { ProjectsResource } from './resources/projects'
import { TasksResource } from './resources/tasks'
import { UsersResource } from './resources/users'

import type { ClientConfig } from './types'

/**
 * A fully composed ProManage API client with all resource namespaces attached.
 *
 * @example
 * ```ts
 * const client = createApiClient({ baseUrl: 'http://localhost:3001' })
 *
 * // Login
 * const { user, accessToken } = await client.auth.login({ email, password })
 *
 * // Fetch projects (access token is now set on the client)
 * const { data: projects, meta } = await client.projects.list({ page: 1 })
 * ```
 */
export interface ApiClient {
  /** Core HTTP client — use directly for custom requests. */
  core: ProManageClient
  auth: AuthResource
  calendarEvents: CalendarEventsResource
  channels: ChannelsResource
  contacts: ContactsResource
  dashboard: DashboardResource
  licenses: LicensesResource
  health: HealthResource
  messaging: MessagingResource
  notifications: NotificationsResource
  organizations: OrganizationsResource
  procedures: ProceduresResource
  projects: ProjectsResource
  tasks: TasksResource
  users: UsersResource
}

/**
 * Create a configured ProManage API client.
 * The returned object exposes typed resource namespaces (auth, projects, etc.)
 * and the underlying core client for advanced use.
 */
export function createApiClient(config: ClientConfig): ApiClient {
  const core = new ProManageClient(config)

  return {
    core,
    auth: new AuthResource(core),
    calendarEvents: new CalendarEventsResource(core),
    channels: new ChannelsResource(core),
    contacts: new ContactsResource(core),
    dashboard: new DashboardResource(core),
    licenses: new LicensesResource(core),
    health: new HealthResource(core),
    messaging: new MessagingResource(core),
    notifications: new NotificationsResource(core),
    organizations: new OrganizationsResource(core),
    procedures: new ProceduresResource(core),
    projects: new ProjectsResource(core),
    tasks: new TasksResource(core),
    users: new UsersResource(core),
  }
}
