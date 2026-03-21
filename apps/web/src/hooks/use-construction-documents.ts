'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AddDrawingRevisionInput,
  AddSpecificationRevisionInput,
  CreateDrawingDisciplineInput,
  CreateDrawingSetInput,
  CreateDrawingSheetInput,
  CreateSpecificationSectionInput,
  UpdateDrawingDisciplineInput,
  UpdateDrawingSetInput,
  UpdateDrawingSheetInput,
  UpdateSpecificationSectionInput,
} from '@promanage/core'

import { getApiClient } from '@/lib/api-client'


// ─── Query keys ──────────────────────────────────────────────────────────────

export const cdKeys = {
  disciplines: () => ['drawing-disciplines'] as const,
  drawingSets: (projectId: string) => ['drawing-sets', projectId] as const,
  drawingSheets: (projectId: string) => ['drawing-sheets', projectId] as const,
  drawingRevisions: (projectId: string, sheetId: string) =>
    ['drawing-revisions', projectId, sheetId] as const,
  specSections: (projectId: string) => ['spec-sections', projectId] as const,
  specRevisions: (projectId: string, sectionId: string) =>
    ['spec-revisions', projectId, sectionId] as const,
}

// ─── Disciplines ──────────────────────────────────────────────────────────────

export function useDrawingDisciplines() {
  return useQuery({
    queryKey: cdKeys.disciplines(),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listDisciplines()
      return res.data
    },
  })
}

export function useCreateDiscipline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDrawingDisciplineInput) =>
      getApiClient().constructionDocuments.createDiscipline(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.disciplines() }),
  })
}

export function useUpdateDiscipline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDrawingDisciplineInput }) =>
      getApiClient().constructionDocuments.updateDiscipline(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.disciplines() }),
  })
}

export function useDeleteDiscipline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => getApiClient().constructionDocuments.deleteDiscipline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.disciplines() }),
  })
}

// ─── Drawing Sets ─────────────────────────────────────────────────────────────

export function useDrawingSets(projectId: string) {
  return useQuery({
    queryKey: cdKeys.drawingSets(projectId),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listDrawingSets(projectId)
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateDrawingSet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDrawingSetInput) =>
      getApiClient().constructionDocuments.createDrawingSet(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSets(projectId) }),
  })
}

export function useUpdateDrawingSet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ setId, input }: { setId: string; input: UpdateDrawingSetInput }) =>
      getApiClient().constructionDocuments.updateDrawingSet(projectId, setId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSets(projectId) }),
  })
}

export function useDeleteDrawingSet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (setId: string) =>
      getApiClient().constructionDocuments.deleteDrawingSet(projectId, setId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSets(projectId) }),
  })
}

// ─── Drawing Sheets ───────────────────────────────────────────────────────────

export function useDrawingSheets(projectId: string) {
  return useQuery({
    queryKey: cdKeys.drawingSheets(projectId),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listDrawingSheets(projectId)
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateDrawingSheet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDrawingSheetInput) =>
      getApiClient().constructionDocuments.createDrawingSheet(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSheets(projectId) }),
  })
}

export function useUpdateDrawingSheet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sheetId, input }: { sheetId: string; input: UpdateDrawingSheetInput }) =>
      getApiClient().constructionDocuments.updateDrawingSheet(projectId, sheetId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSheets(projectId) }),
  })
}

export function useDeleteDrawingSheet(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sheetId: string) =>
      getApiClient().constructionDocuments.deleteDrawingSheet(projectId, sheetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.drawingSheets(projectId) }),
  })
}

export function useAddDrawingRevision(projectId: string, sheetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddDrawingRevisionInput) =>
      getApiClient().constructionDocuments.addDrawingRevision(projectId, sheetId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cdKeys.drawingSheets(projectId) })
      qc.invalidateQueries({ queryKey: cdKeys.drawingRevisions(projectId, sheetId) })
    },
  })
}

export function useDrawingRevisions(projectId: string, sheetId: string) {
  return useQuery({
    queryKey: cdKeys.drawingRevisions(projectId, sheetId),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listDrawingRevisions(projectId, sheetId)
      return res.data
    },
    enabled: !!projectId && !!sheetId,
  })
}

// ─── Specification Sections ───────────────────────────────────────────────────

export function useSpecSections(projectId: string) {
  return useQuery({
    queryKey: cdKeys.specSections(projectId),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listSpecSections(projectId)
      return res.data
    },
    enabled: !!projectId,
  })
}

export function useCreateSpecSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSpecificationSectionInput) =>
      getApiClient().constructionDocuments.createSpecSection(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.specSections(projectId) }),
  })
}

export function useUpdateSpecSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sectionId, input }: { sectionId: string; input: UpdateSpecificationSectionInput }) =>
      getApiClient().constructionDocuments.updateSpecSection(projectId, sectionId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.specSections(projectId) }),
  })
}

export function useDeleteSpecSection(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sectionId: string) =>
      getApiClient().constructionDocuments.deleteSpecSection(projectId, sectionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cdKeys.specSections(projectId) }),
  })
}

export function useAddSpecRevision(projectId: string, sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AddSpecificationRevisionInput) =>
      getApiClient().constructionDocuments.addSpecRevision(projectId, sectionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cdKeys.specSections(projectId) })
      qc.invalidateQueries({ queryKey: cdKeys.specRevisions(projectId, sectionId) })
    },
  })
}

export function useSpecRevisions(projectId: string, sectionId: string) {
  return useQuery({
    queryKey: cdKeys.specRevisions(projectId, sectionId),
    queryFn: async () => {
      const res = await getApiClient().constructionDocuments.listSpecRevisions(projectId, sectionId)
      return res.data
    },
    enabled: !!projectId && !!sectionId,
  })
}
