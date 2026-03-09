import { z } from 'zod'

const eventTypes = ['MEETING', 'MILESTONE', 'INSPECTION', 'DEADLINE', 'OTHER'] as const

export const createCalendarEventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or less'),
    description: z.string().max(2000).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    allDay: z.boolean().default(false),
    eventType: z.enum(eventTypes).default('OTHER'),
    projectId: z.string().cuid().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  eventType: z.enum(eventTypes).optional(),
  projectId: z.string().cuid().nullish(),
})

export type CreateCalendarEventSchemaInput = z.infer<typeof createCalendarEventSchema>
export type UpdateCalendarEventSchemaInput = z.infer<typeof updateCalendarEventSchema>
