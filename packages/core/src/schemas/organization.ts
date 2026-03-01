import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be 100 characters or less'),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase with hyphens only'
    )
    .optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
})

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(255).nullish(),
  phone: z.string().max(20).nullish(),
  email: z.string().email().nullish(),
  logoUrl: z.string().url().nullish(),
})

export type CreateOrganizationSchemaInput = z.infer<
  typeof createOrganizationSchema
>
export type UpdateOrganizationSchemaInput = z.infer<
  typeof updateOrganizationSchema
>
