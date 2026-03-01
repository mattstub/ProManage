import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less'),
  phone: z.string().max(20).optional(),
})

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(50)
    .optional(),
  phone: z.string().max(20).nullish(),
  avatarUrl: z.string().url().nullish(),
})

export type CreateUserSchemaInput = z.infer<typeof createUserSchema>
export type UpdateUserSchemaInput = z.infer<typeof updateUserSchema>
