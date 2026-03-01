import type { RoleName } from './role'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatarUrl?: string | null
  isActive: boolean
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface UserWithRoles extends User {
  roles: RoleName[]
}

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string | null
  avatarUrl?: string | null
}
