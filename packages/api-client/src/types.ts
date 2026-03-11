import type { PaginationMeta } from '@promanage/core'

export interface ClientConfig {
  /**
   * Base URL of the ProManage API, e.g. "http://localhost:3001"
   * Do NOT include a trailing slash.
   */
  baseUrl: string

  /**
   * Initial JWT access token. Can be set later via client.setAccessToken().
   */
  accessToken?: string

  /**
   * Called whenever the access token is silently refreshed.
   * Use this to persist the new token (e.g. in memory or a Zustand store).
   */
  onTokenRefresh?: (accessToken: string) => void

  /**
   * Called when both the access token and refresh token are expired/invalid.
   * Use this to redirect to the login page.
   */
  onAuthError?: () => void
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Query params appended to the URL. Undefined values are omitted. */
  params?: Record<string, string | number | boolean | undefined>
  /** Set true for the refresh call itself to avoid infinite retry loops. */
  skipAuthRetry?: boolean
}

export interface PaginationParams {
  page?: number
  perPage?: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}
