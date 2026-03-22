'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AddProjectSdsEntryInput,
  CreateJobHazardAnalysisInput,
  CreateProjectEmergencyContactInput,
  UpdateJobHazardAnalysisInput,
  UpdateProjectEmergencyContactInput,
  UpdateProjectSdsEntryInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'

// ─── Query keys ──────────────────────────────────────────────────────────────

export const jobSafetyKeys = {
  jhas: (projectId: string) => ['jhas', projectId] as const,
  jha: (projectId: string, id: string) => ['jhas', projectId, id] as const,
  emergencyContacts: (projectId: string) => ['emergency-contacts', projectId] as const,
  projectSdsEntries: (projectId: string) => ['project-sds', projectId] as const,
  projectSafetyDocs: (projectId: string) => ['project-safety-docs', projectId] as const,
  projectToolboxTalks: (projectId: string) => ['project-toolbox-talks', projectId] as const,
  projectIncidents: (projectId: string) => ['project-incidents', projectId] as const,
}

// ─── JHAs ─────────────────────────────────────────────────────────────────────

export function useJhas(projectId: string, params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...jobSafetyKeys.jhas(projectId), params],
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listJhas(projectId, params)
      return res
    },
    enabled: !!projectId,
  })
}

export function useCreateJha(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJobHazardAnalysisInput) =>
      getApiClient().jobSafety.createJha(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.jhas(projectId) })
    },
  })
}

export function useUpdateJha(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJobHazardAnalysisInput }) =>
      getApiClient().jobSafety.updateJha(projectId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.jhas(projectId) })
    },
  })
}

export function useDeleteJha(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().jobSafety.deleteJha(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.jhas(projectId) })
    },
  })
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export function useEmergencyContacts(projectId: string) {
  return useQuery({
    queryKey: jobSafetyKeys.emergencyContacts(projectId),
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listEmergencyContacts(projectId)
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateEmergencyContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProjectEmergencyContactInput) =>
      getApiClient().jobSafety.createEmergencyContact(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.emergencyContacts(projectId) })
    },
  })
}

export function useUpdateEmergencyContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectEmergencyContactInput }) =>
      getApiClient().jobSafety.updateEmergencyContact(projectId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.emergencyContacts(projectId) })
    },
  })
}

export function useDeleteEmergencyContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().jobSafety.deleteEmergencyContact(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.emergencyContacts(projectId) })
    },
  })
}

// ─── Project SDS Binder ───────────────────────────────────────────────────────

export function useProjectSdsEntries(projectId: string, params?: { search?: string }) {
  return useQuery({
    queryKey: [...jobSafetyKeys.projectSdsEntries(projectId), params],
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listProjectSdsEntries(projectId, params)
      return res
    },
    enabled: !!projectId,
  })
}

export function useAddProjectSdsEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddProjectSdsEntryInput) =>
      getApiClient().jobSafety.addProjectSdsEntry(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.projectSdsEntries(projectId) })
    },
  })
}

export function useUpdateProjectSdsEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectSdsEntryInput }) =>
      getApiClient().jobSafety.updateProjectSdsEntry(projectId, id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.projectSdsEntries(projectId) })
    },
  })
}

export function useRemoveProjectSdsEntry(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().jobSafety.removeProjectSdsEntry(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobSafetyKeys.projectSdsEntries(projectId) })
    },
  })
}

// ─── Project-scoped safety read views ────────────────────────────────────────

export function useProjectSafetyDocuments(projectId: string) {
  return useQuery({
    queryKey: jobSafetyKeys.projectSafetyDocs(projectId),
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listProjectSafetyDocuments(projectId)
      return res
    },
    enabled: !!projectId,
  })
}

export function useProjectToolboxTalks(projectId: string) {
  return useQuery({
    queryKey: jobSafetyKeys.projectToolboxTalks(projectId),
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listProjectToolboxTalks(projectId)
      return res
    },
    enabled: !!projectId,
  })
}

export function useProjectIncidents(projectId: string) {
  return useQuery({
    queryKey: jobSafetyKeys.projectIncidents(projectId),
    queryFn: async () => {
      const res = await getApiClient().jobSafety.listProjectIncidents(projectId)
      return res
    },
    enabled: !!projectId,
  })
}
