export type LicenseHolderType = 'ORGANIZATION' | 'USER'

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUSPENDED' | 'REVOKED'

export interface License {
  id: string
  organizationId: string
  name: string
  licenseNumber: string | null
  authority: string | null
  licenseType: string | null
  holderType: LicenseHolderType
  userId: string | null
  startDate: string | null
  expirationDate: string | null
  renewalDate: string | null
  status: LicenseStatus
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface LicenseDocument {
  id: string
  licenseId: string
  fileName: string
  fileKey: string
  fileUrl: string
  fileSize: number
  mimeType: string
  documentTag: string | null
  uploadedById: string
  createdAt: string
}

export interface LicenseReminder {
  id: string
  licenseId: string
  daysBeforeExpiration: number
  notifyUserId: string
  notifySupervisorId: string | null
  isActive: boolean
  lastNotifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LicenseUserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
}

export interface LicenseWithRelations extends License {
  user: LicenseUserSummary | null
  createdBy: LicenseUserSummary
  documents: LicenseDocument[]
  reminders: (LicenseReminder & {
    notifyUser: LicenseUserSummary
    notifySupervisor: LicenseUserSummary | null
  })[]
}

export interface CreateLicenseInput {
  name: string
  licenseNumber?: string
  authority?: string
  licenseType?: string
  holderType: LicenseHolderType
  userId?: string
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  status?: LicenseStatus
  notes?: string
}

export interface UpdateLicenseInput {
  name?: string
  licenseNumber?: string
  authority?: string
  licenseType?: string
  holderType?: LicenseHolderType
  userId?: string
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  status?: LicenseStatus
  notes?: string
}

export interface CreateLicenseReminderInput {
  daysBeforeExpiration: number
  notifyUserId: string
  notifySupervisorId?: string
  isActive?: boolean
}

export interface UpdateLicenseReminderInput {
  daysBeforeExpiration?: number
  notifyUserId?: string
  notifySupervisorId?: string
  isActive?: boolean
}
