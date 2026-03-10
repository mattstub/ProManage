import { z } from 'zod'

const ROLE_NAMES = [
  'Admin',
  'ProjectManager',
  'Superintendent',
  'Foreman',
  'FieldUser',
  'OfficeAdmin',
] as const

export const sendDirectMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Message body is required')
    .max(5000, 'Message must be 5000 characters or less'),
})

export const createAnnouncementSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be 200 characters or less'),
  body: z
    .string()
    .min(1, 'Body is required')
    .max(10000, 'Body must be 10000 characters or less'),
  targetRole: z.enum(ROLE_NAMES).optional(),
  scheduledAt: z.coerce.date().optional(),
})

export const updateAnnouncementSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  targetRole: z.enum(ROLE_NAMES).nullish(),
  scheduledAt: z.coerce.date().nullish(),
})

export type SendDirectMessageSchemaInput = z.infer<typeof sendDirectMessageSchema>
export type CreateAnnouncementSchemaInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementSchemaInput = z.infer<typeof updateAnnouncementSchema>
