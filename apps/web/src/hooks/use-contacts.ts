'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListContactsParams } from '@promanage/api-client'
import type { CreateContactInput, UpdateContactInput } from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useContacts(params?: ListContactsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => getApiClient().contacts.list(params),
    enabled: isAuthenticated,
  })
}

export function useContact(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getApiClient().contacts.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateContactInput) => getApiClient().contacts.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateContactInput & { id: string }) =>
      getApiClient().contacts.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().contacts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useAddContactToProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId, projectId }: { contactId: string; projectId: string }) =>
      getApiClient().contacts.addToProject(contactId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
    },
  })
}

export function useRemoveContactFromProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ contactId, projectId }: { contactId: string; projectId: string }) =>
      getApiClient().contacts.removeFromProject(contactId, projectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] })
    },
  })
}
