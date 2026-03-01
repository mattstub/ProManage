export type RoleName =
  | 'Admin'
  | 'ProjectManager'
  | 'Superintendent'
  | 'Foreman'
  | 'FieldUser'
  | 'OfficeAdmin'

export interface Role {
  id: string
  name: RoleName
  description?: string | null
  isSystem: boolean
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  id: string
  resource: string
  action: string
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[]
}
