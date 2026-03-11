import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  projectId: z.string().optional(),
})

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  projectId: z.string().optional(),
})

export const sendChatMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  parentId: z.string().optional(),
})

export const updateChannelPermissionSchema = z.object({
  roleName: z.enum([
    'Admin',
    'ProjectManager',
    'Superintendent',
    'Foreman',
    'FieldUser',
    'OfficeAdmin',
  ]),
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
  canManage: z.boolean().optional(),
})

export type CreateChannelSchemaInput = z.infer<typeof createChannelSchema>
export type UpdateChannelSchemaInput = z.infer<typeof updateChannelSchema>
export type SendChatMessageSchemaInput = z.infer<typeof sendChatMessageSchema>
export type UpdateChannelPermissionSchemaInput = z.infer<typeof updateChannelPermissionSchema>
