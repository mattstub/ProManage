import { ApiClientError } from './errors'

import type { ClientConfig, RequestOptions } from './types'

/**
 * Core HTTP client for the ProManage API.
 *
 * - Attaches the JWT access token to every request automatically.
 * - On 401 responses, silently refreshes the access token via the
 *   httpOnly refresh-token cookie and retries the original request once.
 * - On permanent auth failure, calls config.onAuthError() so the app
 *   can redirect to login.
 *
 * Credentials (cookies) are always sent with `credentials: 'include'`
 * so the browser forwards the httpOnly refresh-token cookie on refresh calls.
 */
export class ProManageClient {
  private accessToken: string | null

  constructor(private readonly config: ClientConfig) {
    this.accessToken = config.accessToken ?? null
  }

  /** Replace the in-memory access token (e.g. after login or page load). */
  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  /** Read the current in-memory access token. */
  getAccessToken(): string | null {
    return this.accessToken
  }

  /**
   * Make a typed API request.
   *
   * @param path  Path relative to the API base, e.g. '/api/v1/auth/login'
   * @param options  Method, body, query params, and retry flags.
   * @returns The parsed response body typed as T.
   * @throws {ApiClientError} On non-2xx responses.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, params, skipAuthRetry = false } = options

    const url = this.buildUrl(path, params)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(url, {
      method,
      headers,
      credentials: 'include', // send httpOnly refresh-token cookie
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // Silent token refresh on 401 — but only if we haven't already retried
    if (response.status === 401 && !skipAuthRetry) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        return this.request<T>(path, { ...options, skipAuthRetry: true })
      }
      // Refresh also failed — notify the app
      this.config.onAuthError?.()
      throw new ApiClientError(401, 'UNAUTHORIZED', 'Session expired. Please log in again.')
    }

    return this.parseResponse<T>(response)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const base = this.config.baseUrl.replace(/\/$/, '')
    const url = new URL(`${base}${path}`)

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    return url.toString()
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    // 204 No Content — return undefined cast to T (callers should expect void)
    if (response.status === 204) {
      return undefined as T
    }

    const json = await response.json()

    if (!response.ok) {
      const error = json?.error ?? {}
      throw new ApiClientError(
        response.status,
        error.code ?? 'UNKNOWN_ERROR',
        error.message ?? 'An unexpected error occurred',
        error.details,
      )
    }

    return json as T
  }

  /**
   * Attempt to refresh the access token using the httpOnly cookie.
   * Returns true if successful and the in-memory token was updated.
   */
  private async tryRefresh(): Promise<boolean> {
    try {
      const url = this.buildUrl('/api/v1/auth/refresh')

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      })

      if (!response.ok) return false

      const json = await response.json()
      const newToken: string | undefined = json?.data?.accessToken

      if (!newToken) return false

      this.accessToken = newToken
      this.config.onTokenRefresh?.(newToken)

      return true
    } catch {
      return false
    }
  }
}
