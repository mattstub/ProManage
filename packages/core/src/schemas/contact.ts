import { z } from 'zod'

import { CONTACT_TYPE_LIST } from '../constants/contact'

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(200).optional().nullable(),
  type: z.enum(CONTACT_TYPE_LIST),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  mobile: z.string().max(30).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional().nullable(),
  type: z.enum(CONTACT_TYPE_LIST).optional(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  mobile: z.string().max(30).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
})

export type CreateContactSchemaInput = z.infer<typeof createContactSchema>
export type UpdateContactSchemaInput = z.infer<typeof updateContactSchema>
