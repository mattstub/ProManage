import type { LicenseHolderType, LicenseStatus } from '../types/license'

export const LICENSE_HOLDER_TYPES: Record<LicenseHolderType, { label: string }> = {
  ORGANIZATION: { label: 'Organization' },
  USER: { label: 'Individual' },
}

export const LICENSE_HOLDER_TYPE_LIST = Object.entries(LICENSE_HOLDER_TYPES).map(
  ([value, meta]) => ({ value: value as LicenseHolderType, ...meta })
)

export const LICENSE_STATUSES: Record<LicenseStatus, { label: string; color: string }> = {
  ACTIVE:    { label: 'Active',    color: 'green'  },
  EXPIRED:   { label: 'Expired',   color: 'red'    },
  PENDING:   { label: 'Pending',   color: 'yellow' },
  SUSPENDED: { label: 'Suspended', color: 'orange' },
  REVOKED:   { label: 'Revoked',   color: 'red'    },
}

export const LICENSE_STATUS_LIST = Object.entries(LICENSE_STATUSES).map(
  ([value, meta]) => ({ value: value as LicenseStatus, ...meta })
)

// Thresholds at which the reminder plugin considers a license "expiring soon"
// <=7 days → daily notification; >7 days (e.g. 30) → once per expiration cycle
export const LICENSE_REMINDER_DAILY_THRESHOLD = 7
