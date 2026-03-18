'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  ListSafetyDocumentsParams,
  ListSdsEntriesParams,
  ListToolboxTalksParams,
  ListSafetyFormsParams,
  ListIncidentReportsParams,
} from '@promanage/api-client'
import type {
  CreateSafetyDocumentInput,
  UpdateSafetyDocumentInput,
  CreateSdsEntryInput,
  UpdateSdsEntryInput,
  CreateToolboxTalkInput,
  UpdateToolboxTalkInput,
  CreateToolboxTalkAttendeeInput,
  CreateSafetyFormInput,
  UpdateSafetyFormInput,
  CreateIncidentReportInput,
  UpdateIncidentReportInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

// ─── Safety Documents ────────────────────────────────────────────────────────

export function useSafetyDocuments(params?: ListSafetyDocumentsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['safety-documents', params],
    queryFn: () => getApiClient().safety.listDocuments(params),
    enabled: isAuthenticated,
  })
}

export function useSafetyDocument(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['safety-documents', id],
    queryFn: () => getApiClient().safety.getDocument(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useUploadSafetyDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      meta,
    }: {
      file: File
      meta: Omit<CreateSafetyDocumentInput, 'fileName' | 'fileKey' | 'fileSize' | 'mimeType'>
    }) => {
      const client = getApiClient()

      // Step 1: get presigned URL
      const { uploadUrl, fileKey } = await client.safety.getDocumentUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      })

      // Step 2: upload directly to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      // Step 3: confirm and create DB record
      return client.safety.createDocument({
        ...meta,
        fileName: file.name,
        fileKey,
        fileSize: file.size,
        mimeType: file.type,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-documents'] })
    },
  })
}

export function useUpdateSafetyDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSafetyDocumentInput & { id: string }) =>
      getApiClient().safety.updateDocument(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['safety-documents'] })
      queryClient.invalidateQueries({ queryKey: ['safety-documents', variables.id] })
    },
  })
}

export function useDeleteSafetyDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().safety.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-documents'] })
    },
  })
}

export function useDownloadSafetyDocument() {
  return useMutation({
    mutationFn: async (id: string) => {
      const newWindow = window.open('', '_blank', 'noopener,noreferrer')
      const { downloadUrl } = await getApiClient().safety.getDocumentDownloadUrl(id)
      if (newWindow) {
        newWindow.location.href = downloadUrl
      } else {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      }
    },
  })
}

// ─── SDS Catalog ─────────────────────────────────────────────────────────────

export function useSdsEntries(params?: ListSdsEntriesParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['sds-entries', params],
    queryFn: () => getApiClient().safety.listSds(params),
    enabled: isAuthenticated,
  })
}

export function useUploadSds() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      meta,
    }: {
      file?: File
      meta: CreateSdsEntryInput
    }) => {
      const client = getApiClient()
      let sdsFileKey: string | undefined
      let sdsFileName: string | undefined

      if (file) {
        const { uploadUrl, fileKey } = await client.safety.getSdsUploadUrl({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        })

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadResponse.ok) {
          throw new Error(`SDS upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        sdsFileKey = fileKey
        sdsFileName = file.name
      }

      return client.safety.createSds({ ...meta, sdsFileKey, sdsFileName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sds-entries'] })
    },
  })
}

export function useUpdateSdsEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSdsEntryInput & { id: string }) =>
      getApiClient().safety.updateSds(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sds-entries'] })
    },
  })
}

export function useDeleteSdsEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().safety.deleteSds(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sds-entries'] })
    },
  })
}

export function useDownloadSds() {
  return useMutation({
    mutationFn: async (id: string) => {
      const newWindow = window.open('', '_blank', 'noopener,noreferrer')
      const { downloadUrl } = await getApiClient().safety.getSdsDownloadUrl(id)
      if (newWindow) {
        newWindow.location.href = downloadUrl
      } else {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer')
      }
    },
  })
}

// ─── Toolbox Talks ────────────────────────────────────────────────────────────

export function useToolboxTalks(params?: ListToolboxTalksParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['toolbox-talks', params],
    queryFn: () => getApiClient().safety.listTalks(params),
    enabled: isAuthenticated,
  })
}

export function useToolboxTalk(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['toolbox-talks', id],
    queryFn: () => getApiClient().safety.getTalk(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateToolboxTalk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateToolboxTalkInput) => getApiClient().safety.createTalk(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks'] })
    },
  })
}

export function useUpdateToolboxTalk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateToolboxTalkInput & { id: string }) =>
      getApiClient().safety.updateTalk(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks'] })
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks', variables.id] })
    },
  })
}

export function useDeleteToolboxTalk() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().safety.deleteTalk(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks'] })
    },
  })
}

export function useAddTalkAttendee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ talkId, ...input }: CreateToolboxTalkAttendeeInput & { talkId: string }) =>
      getApiClient().safety.addAttendee(talkId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks', variables.talkId] })
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks'] })
    },
  })
}

export function useRemoveTalkAttendee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ talkId, attendeeId }: { talkId: string; attendeeId: string }) =>
      getApiClient().safety.removeAttendee(talkId, attendeeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks', variables.talkId] })
      queryClient.invalidateQueries({ queryKey: ['toolbox-talks'] })
    },
  })
}

// ─── Safety Forms ─────────────────────────────────────────────────────────────

export function useSafetyForms(params?: ListSafetyFormsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['safety-forms', params],
    queryFn: () => getApiClient().safety.listForms(params),
    enabled: isAuthenticated,
  })
}

export function useCreateSafetyForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSafetyFormInput) => getApiClient().safety.createForm(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-forms'] })
    },
  })
}

export function useUpdateSafetyForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSafetyFormInput & { id: string }) =>
      getApiClient().safety.updateForm(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-forms'] })
    },
  })
}

export function useDeleteSafetyForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().safety.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-forms'] })
    },
  })
}

// ─── Incident Reports ─────────────────────────────────────────────────────────

export function useIncidentReports(params?: ListIncidentReportsParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['incident-reports', params],
    queryFn: () => getApiClient().safety.listIncidents(params),
    enabled: isAuthenticated,
  })
}

export function useCreateIncidentReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateIncidentReportInput) => getApiClient().safety.createIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] })
    },
  })
}

export function useUpdateIncidentReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateIncidentReportInput & { id: string }) =>
      getApiClient().safety.updateIncident(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] })
    },
  })
}

export function useDeleteIncidentReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().safety.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident-reports'] })
    },
  })
}
