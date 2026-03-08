export { ProManageClient } from './client'
export { ApiClientError } from './errors'
export { AuthResource } from './resources/auth'
export { DashboardResource } from './resources/dashboard'
export { HealthResource } from './resources/health'
export { OrganizationsResource } from './resources/organizations'
export { ProceduresResource } from './resources/procedures'
export { ProjectsResource } from './resources/projects'
export { TasksResource } from './resources/tasks'
export { UsersResource } from './resources/users'

export type { ClientConfig, PaginatedResult, PaginationParams, RequestOptions } from './types'
export type { HealthResponse } from './resources/health'
export type { ListProceduresParams } from './resources/procedures'
export type { ListProjectsParams } from './resources/projects'
export type { ListTasksParams } from './resources/tasks'

import { ProManageClient } from './client'
import { AuthResource } from './resources/auth'
import { DashboardResource } from './resources/dashboard'
import { HealthResource } from './resources/health'
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
  dashboard: DashboardResource
  health: HealthResource
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
    dashboard: new DashboardResource(core),
    health: new HealthResource(core),
    organizations: new OrganizationsResource(core),
    procedures: new ProceduresResource(core),
    projects: new ProjectsResource(core),
    tasks: new TasksResource(core),
    users: new UsersResource(core),
  }
}
