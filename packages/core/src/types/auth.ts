import type { UserWithRoles } from './user'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName: string
}

export interface AuthResponse {
  user: UserWithRoles
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface TokenPayload {
  sub: string
  email: string
  organizationId: string
  iat: number
  exp: number
}
