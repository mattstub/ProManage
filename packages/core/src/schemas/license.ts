import { z } from 'zod'

const LICENSE_HOLDER_TYPES = ['ORGANIZATION', 'USER'] as const
const LICENSE_STATUSES = ['ACTIVE', 'EXPIRED', 'PENDING', 'SUSPENDED', 'REVOKED'] as const

export const createLicenseSchema = z.object({
  name: z.string().min(1).max(200),
  licenseNumber: z.string().max(100).optional(),
  authority: z.string().max(200).optional(),
  licenseType: z.string().max(200).optional(),
  holderType: z.enum(LICENSE_HOLDER_TYPES),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  status: z.enum(LICENSE_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
})

export const updateLicenseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  licenseNumber: z.string().max(100).optional(),
  authority: z.string().max(200).optional(),
  licenseType: z.string().max(200).optional(),
  holderType: z.enum(LICENSE_HOLDER_TYPES).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  expirationDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  status: z.enum(LICENSE_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
})

export const createLicenseReminderSchema = z.object({
  daysBeforeExpiration: z.number().int().min(1).max(365),
  notifyUserId: z.string().min(1),
  notifySupervisorId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateLicenseReminderSchema = z.object({
  daysBeforeExpiration: z.number().int().min(1).max(365).optional(),
  notifyUserId: z.string().min(1).optional(),
  notifySupervisorId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateLicenseSchema = z.infer<typeof createLicenseSchema>
export type UpdateLicenseSchema = z.infer<typeof updateLicenseSchema>
export type CreateLicenseReminderSchema = z.infer<typeof createLicenseReminderSchema>
export type UpdateLicenseReminderSchema = z.infer<typeof updateLicenseReminderSchema>
