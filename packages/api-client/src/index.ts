export { ProManageClient } from './client'
export { ApiClientError } from './errors'
export { AuthResource } from './resources/auth'
export { UsersResource } from './resources/users'
export { OrganizationsResource } from './resources/organizations'
export { HealthResource } from './resources/health'

export type { ClientConfig, RequestOptions, PaginationParams, PaginatedResult } from './types'
export type { HealthResponse } from './resources/health'

import { ProManageClient } from './client'
import { AuthResource } from './resources/auth'
import { UsersResource } from './resources/users'
import { OrganizationsResource } from './resources/organizations'
import { HealthResource } from './resources/health'

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
 * // Fetch users (access token is now set on the client)
 * const { data: users, meta } = await client.users.list({ page: 1 })
 * ```
 */
export interface ApiClient {
  /** Core HTTP client — use directly for custom requests. */
  core: ProManageClient
  auth: AuthResource
  users: UsersResource
  organizations: OrganizationsResource
  health: HealthResource
}

/**
 * Create a configured ProManage API client.
 * The returned object exposes typed resource namespaces (auth, users, etc.)
 * and the underlying core client for advanced use.
 */
export function createApiClient(config: ClientConfig): ApiClient {
  const core = new ProManageClient(config)

  return {
    core,
    auth: new AuthResource(core),
    users: new UsersResource(core),
    organizations: new OrganizationsResource(core),
    health: new HealthResource(core),
  }
}
