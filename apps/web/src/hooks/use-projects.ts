'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AssignContactToProjectInput,
  CreateProjectScopeInput,
  ListProjectsParams,
  UpdateProjectScopeInput,
  UpdateProjectSettingsInput,
} from '@promanage/api-client'
import type { CreateProjectInput, UpdateProjectInput } from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useProjects(params?: ListProjectsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getApiClient().projects.list(params),
    enabled: isAuthenticated,
  })
}

export function useProject(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => getApiClient().projects.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useProjectDashboard(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id, 'dashboard'],
    queryFn: () => getApiClient().projects.getDashboard(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useProjectContacts(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id, 'contacts'],
    queryFn: () => getApiClient().projects.listContacts(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useProjectScopes(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id, 'scopes'],
    queryFn: () => getApiClient().projects.listScopes(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useProjectSettings(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['projects', id, 'settings'],
    queryFn: () => getApiClient().projects.getSettings(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProjectInput) => getApiClient().projects.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProjectInput & { id: string }) =>
      getApiClient().projects.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
    },
  })
}

export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().projects.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useAssignContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      contactId,
      input,
    }: {
      projectId: string
      contactId: string
      input: AssignContactToProjectInput
    }) => getApiClient().projects.assignContact(projectId, contactId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'contacts'] })
    },
  })
}

export function useRemoveProjectContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, contactId }: { projectId: string; contactId: string }) =>
      getApiClient().projects.removeContact(projectId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'contacts'] })
    },
  })
}

export function useCreateProjectScope() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateProjectScopeInput }) =>
      getApiClient().projects.createScope(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'scopes'] })
    },
  })
}

export function useUpdateProjectScope() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      scopeId,
      input,
    }: {
      projectId: string
      scopeId: string
      input: UpdateProjectScopeInput
    }) => getApiClient().projects.updateScope(projectId, scopeId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'scopes'] })
    },
  })
}

export function useDeleteProjectScope() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, scopeId }: { projectId: string; scopeId: string }) =>
      getApiClient().projects.deleteScope(projectId, scopeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'scopes'] })
    },
  })
}

export function useUpdateProjectSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectSettingsInput }) =>
      getApiClient().projects.updateSettings(projectId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'settings'] })
    },
  })
}
