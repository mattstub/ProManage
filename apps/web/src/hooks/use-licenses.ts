'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListLicensesParams } from '@promanage/api-client'
import type {
  CreateLicenseInput,
  UpdateLicenseInput,
  CreateLicenseReminderInput,
  UpdateLicenseReminderInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth.store'

export function useLicenses(params?: ListLicensesParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['licenses', params],
    queryFn: () => getApiClient().licenses.list(params),
    enabled: isAuthenticated,
  })
}

export function useLicense(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['licenses', id],
    queryFn: () => getApiClient().licenses.get(id),
    enabled: isAuthenticated && Boolean(id),
  })
}

export function useCreateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLicenseInput) => getApiClient().licenses.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

export function useUpdateLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateLicenseInput & { id: string }) =>
      getApiClient().licenses.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.id] })
    },
  })
}

export function useDeleteLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => getApiClient().licenses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

// ─── Document upload (3-step: get URL → upload → confirm) ────────────────────

export function useUploadLicenseDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      licenseId,
      file,
      documentTag,
    }: {
      licenseId: string
      file: File
      documentTag?: string
    }) => {
      const client = getApiClient()

      // Step 1: get presigned URL
      const { uploadUrl, fileKey } = await client.licenses.getDocumentUploadUrl(licenseId, {
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
        throw new Error(`Document upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      // Step 3: confirm and create DB record
      return client.licenses.confirmDocumentUpload(licenseId, {
        fileName: file.name,
        fileKey,
        fileSize: file.size,
        mimeType: file.type,
        documentTag,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.licenseId] })
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

export function useDownloadLicenseDocument() {
  return useMutation({
    mutationFn: ({ licenseId, docId }: { licenseId: string; docId: string }) =>
      getApiClient().licenses.getDocumentDownloadUrl(licenseId, docId),
  })
}

export function useDeleteLicenseDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ licenseId, docId }: { licenseId: string; docId: string }) =>
      getApiClient().licenses.deleteDocument(licenseId, docId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.licenseId] })
      queryClient.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function useCreateLicenseReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ licenseId, ...input }: CreateLicenseReminderInput & { licenseId: string }) =>
      getApiClient().licenses.createReminder(licenseId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.licenseId] })
    },
  })
}

export function useUpdateLicenseReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      licenseId,
      reminderId,
      ...input
    }: UpdateLicenseReminderInput & { licenseId: string; reminderId: string }) =>
      getApiClient().licenses.updateReminder(licenseId, reminderId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.licenseId] })
    },
  })
}

export function useDeleteLicenseReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ licenseId, reminderId }: { licenseId: string; reminderId: string }) =>
      getApiClient().licenses.deleteReminder(licenseId, reminderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['licenses', variables.licenseId] })
    },
  })
}
