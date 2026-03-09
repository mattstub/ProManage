import { describe, it, expect } from 'vitest'

import { createCalendarEventSchema, updateCalendarEventSchema } from '../../schemas/calendar-event'

const VALID_CUID = 'clh1234567890abcdefghijkl'

describe('createCalendarEventSchema', () => {
  const validEvent = {
    title: 'Site Inspection',
    description: 'Monthly safety walkthrough',
    startDate: '2026-03-15',
    endDate: '2026-03-15',
    allDay: true,
    eventType: 'INSPECTION' as const,
    projectId: VALID_CUID,
  }

  it('accepts valid event with all fields', () => {
    const result = createCalendarEventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Site Inspection')
      expect(result.data.eventType).toBe('INSPECTION')
      expect(result.data.allDay).toBe(true)
    }
  })

  it('accepts minimal valid event (title, startDate, endDate only)', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Team Meeting',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventType).toBe('OTHER')
      expect(result.data.allDay).toBe(false)
    }
  })

  it('rejects missing title', () => {
    const result = createCalendarEventSchema.safeParse({
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty title', () => {
    const result = createCalendarEventSchema.safeParse({
      title: '',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required')
    }
  })

  it('rejects title over 200 characters', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'a'.repeat(201),
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title must be 200 characters or less')
    }
  })

  it('rejects missing startDate', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing endDate', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects endDate before startDate', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-20',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('End date must be on or after start date')
    }
  })

  it('accepts endDate equal to startDate', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(true)
  })

  it('accepts endDate after startDate (multi-day event)', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Conference',
      startDate: '2026-03-15',
      endDate: '2026-03-18',
    })
    expect(result.success).toBe(true)
  })

  it('coerces string dates to Date objects', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date)
      expect(result.data.endDate).toBeInstanceOf(Date)
    }
  })

  it('rejects invalid date string', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: 'not-a-date',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid eventType', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      eventType: 'UNKNOWN',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid eventType values', () => {
    const types = ['MEETING', 'MILESTONE', 'INSPECTION', 'DEADLINE', 'OTHER'] as const
    for (const eventType of types) {
      const result = createCalendarEventSchema.safeParse({
        title: 'Event',
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        eventType,
      })
      expect(result.success).toBe(true)
    }
  })

  it('defaults eventType to OTHER when not provided', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.eventType).toBe('OTHER')
    }
  })

  it('defaults allDay to false when not provided', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.allDay).toBe(false)
    }
  })

  it('rejects invalid projectId format', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      projectId: 'not-a-cuid',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid CUID projectId', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      projectId: VALID_CUID,
    })
    expect(result.success).toBe(true)
  })

  it('rejects description over 2000 characters', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      description: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts description at exactly 2000 characters', () => {
    const result = createCalendarEventSchema.safeParse({
      title: 'Event',
      startDate: '2026-03-15',
      endDate: '2026-03-15',
      description: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })
})

describe('updateCalendarEventSchema', () => {
  it('accepts empty object (no fields to update)', () => {
    const result = updateCalendarEventSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with only title', () => {
    const result = updateCalendarEventSchema.safeParse({ title: 'Updated title' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated title')
    }
  })

  it('accepts partial update with only eventType', () => {
    const result = updateCalendarEventSchema.safeParse({ eventType: 'MILESTONE' })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = updateCalendarEventSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects title over 200 characters', () => {
    const result = updateCalendarEventSchema.safeParse({ title: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('accepts null for nullable fields (clearing values)', () => {
    const result = updateCalendarEventSchema.safeParse({
      description: null,
      projectId: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
      expect(result.data.projectId).toBeNull()
    }
  })

  it('rejects invalid eventType', () => {
    const result = updateCalendarEventSchema.safeParse({ eventType: 'UNKNOWN' })
    expect(result.success).toBe(false)
  })

  it('coerces string dates to Date objects', () => {
    const result = updateCalendarEventSchema.safeParse({ startDate: '2026-04-01' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date)
    }
  })

  it('rejects invalid date string', () => {
    const result = updateCalendarEventSchema.safeParse({ startDate: 'bad-date' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid projectId format', () => {
    const result = updateCalendarEventSchema.safeParse({ projectId: 'not-a-cuid' })
    expect(result.success).toBe(false)
  })

  it('accepts multiple fields at once', () => {
    const result = updateCalendarEventSchema.safeParse({
      title: 'New title',
      eventType: 'DEADLINE',
      allDay: true,
      description: 'Updated description',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('New title')
      expect(result.data.eventType).toBe('DEADLINE')
      expect(result.data.allDay).toBe(true)
    }
  })
})
