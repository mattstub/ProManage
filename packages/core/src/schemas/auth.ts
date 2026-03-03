import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(128),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less'),
  organizationName: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be 100 characters or less'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
