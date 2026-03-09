'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListCalendarEventsParams } from '@promanage/api-client'
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useCalendarEvents(year: number, month: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // month is 0-indexed (JS convention)
  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()

  const params: ListCalendarEventsParams = { startDate, endDate, perPage: 200 }

  return useQuery({
    queryKey: ['calendarEvents', year, month],
    queryFn: () => getApiClient().calendarEvents.list(params),
    enabled: isAuthenticated,
  })
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCalendarEventInput) =>
      getApiClient().calendarEvents.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateCalendarEventInput & { id: string }) =>
      getApiClient().calendarEvents.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().calendarEvents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] })
    },
  })
}
