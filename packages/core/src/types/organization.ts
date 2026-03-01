export interface Organization {
  id: string
  name: string
  slug: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrganizationInput {
  name: string
  slug?: string
  address?: string
  phone?: string
  email?: string
}

export interface UpdateOrganizationInput {
  name?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
}
