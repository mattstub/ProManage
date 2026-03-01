import type { ProManageClient } from '../client'
import type {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  UserWithRoles,
  ApiResponse,
} from '@promanage/core'

export class AuthResource {
  constructor(private readonly client: ProManageClient) {}

  /**
   * Register a new organization and admin user.
   * Sets the access token on the client automatically.
   */
  async register(body: RegisterRequest): Promise<AuthResponse> {
    const res = await this.client.request<ApiResponse<AuthResponse>>(
      '/api/v1/auth/register',
      { method: 'POST', body, skipAuthRetry: true },
    )
    this.client.setAccessToken(res.data.accessToken)
    return res.data
  }

  /**
   * Log in with email and password.
   * Sets the access token on the client automatically.
   */
  async login(body: LoginRequest): Promise<AuthResponse> {
    const res = await this.client.request<ApiResponse<AuthResponse>>(
      '/api/v1/auth/login',
      { method: 'POST', body, skipAuthRetry: true },
    )
    this.client.setAccessToken(res.data.accessToken)
    return res.data
  }

  /**
   * Silently refresh the access token using the httpOnly cookie.
   * Normally called automatically by the client on 401 — exposed here
   * for explicit use (e.g. on app start to restore a session).
   */
  async refresh(): Promise<RefreshResponse> {
    const res = await this.client.request<ApiResponse<RefreshResponse>>(
      '/api/v1/auth/refresh',
      { method: 'POST', body: {}, skipAuthRetry: true },
    )
    this.client.setAccessToken(res.data.accessToken)
    return res.data
  }

  /**
   * Log out the current user.
   * Clears the in-memory access token and revokes the refresh-token cookie.
   */
  async logout(): Promise<void> {
    await this.client.request<void>('/api/v1/auth/logout', { method: 'POST' })
    this.client.setAccessToken(null)
  }

  /** Return the currently authenticated user with their roles. */
  async me(): Promise<UserWithRoles> {
    const res = await this.client.request<ApiResponse<UserWithRoles>>(
      '/api/v1/auth/me',
    )
    return res.data
  }
}
