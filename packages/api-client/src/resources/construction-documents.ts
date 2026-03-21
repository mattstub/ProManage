import type { ProManageClient } from '../client'
import type {
  AddDrawingRevisionInput,
  AddSpecificationRevisionInput,
  ApiResponse,
  CreateDrawingDisciplineInput,
  CreateDrawingSetInput,
  CreateDrawingSheetInput,
  CreateSpecificationSectionInput,
  DrawingDiscipline,
  DrawingRevision,
  DrawingSet,
  DrawingSheetWithRevision,
  SpecificationRevision,
  SpecificationSectionWithRevision,
  UpdateDrawingDisciplineInput,
  UpdateDrawingSetInput,
  UpdateDrawingSheetInput,
  UpdateSpecificationSectionInput,
} from '@promanage/core'

export interface UploadUrlResult {
  uploadUrl: string
  fileKey: string
  fileName: string
  mimeType: string
  fileSize: number
}

export class ConstructionDocumentsResource {
  constructor(private readonly client: ProManageClient) {}

  private base = '/api/v1/construction-documents'

  // ─── Disciplines ───────────────────────────────────────────────────────────

  async listDisciplines(): Promise<ApiResponse<DrawingDiscipline[]>> {
    return this.client.request<ApiResponse<DrawingDiscipline[]>>(`${this.base}/disciplines`)
  }

  async createDiscipline(input: CreateDrawingDisciplineInput): Promise<ApiResponse<DrawingDiscipline>> {
    return this.client.request<ApiResponse<DrawingDiscipline>>(`${this.base}/disciplines`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateDiscipline(
    disciplineId: string,
    input: UpdateDrawingDisciplineInput
  ): Promise<ApiResponse<DrawingDiscipline>> {
    return this.client.request<ApiResponse<DrawingDiscipline>>(
      `${this.base}/disciplines/${disciplineId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteDiscipline(disciplineId: string): Promise<void> {
    return this.client.request<void>(`${this.base}/disciplines/${disciplineId}`, { method: 'DELETE' })
  }

  // ─── Drawing Sets ──────────────────────────────────────────────────────────

  async listDrawingSets(projectId: string): Promise<ApiResponse<DrawingSet[]>> {
    return this.client.request<ApiResponse<DrawingSet[]>>(`${this.base}/${projectId}/drawing-sets`)
  }

  async createDrawingSet(projectId: string, input: CreateDrawingSetInput): Promise<ApiResponse<DrawingSet>> {
    return this.client.request<ApiResponse<DrawingSet>>(`${this.base}/${projectId}/drawing-sets`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateDrawingSet(
    projectId: string,
    setId: string,
    input: UpdateDrawingSetInput
  ): Promise<ApiResponse<DrawingSet>> {
    return this.client.request<ApiResponse<DrawingSet>>(
      `${this.base}/${projectId}/drawing-sets/${setId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteDrawingSet(projectId: string, setId: string): Promise<void> {
    return this.client.request<void>(`${this.base}/${projectId}/drawing-sets/${setId}`, {
      method: 'DELETE',
    })
  }

  // ─── Drawing Sheets ────────────────────────────────────────────────────────

  async listDrawingSheets(projectId: string): Promise<ApiResponse<DrawingSheetWithRevision[]>> {
    return this.client.request<ApiResponse<DrawingSheetWithRevision[]>>(
      `${this.base}/${projectId}/drawing-sheets`
    )
  }

  async createDrawingSheet(
    projectId: string,
    input: CreateDrawingSheetInput
  ): Promise<ApiResponse<DrawingSheetWithRevision>> {
    return this.client.request<ApiResponse<DrawingSheetWithRevision>>(
      `${this.base}/${projectId}/drawing-sheets`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async updateDrawingSheet(
    projectId: string,
    sheetId: string,
    input: UpdateDrawingSheetInput
  ): Promise<ApiResponse<DrawingSheetWithRevision>> {
    return this.client.request<ApiResponse<DrawingSheetWithRevision>>(
      `${this.base}/${projectId}/drawing-sheets/${sheetId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteDrawingSheet(projectId: string, sheetId: string): Promise<void> {
    return this.client.request<void>(`${this.base}/${projectId}/drawing-sheets/${sheetId}`, {
      method: 'DELETE',
    })
  }

  // ─── Drawing Revisions ─────────────────────────────────────────────────────

  async listDrawingRevisions(
    projectId: string,
    sheetId: string
  ): Promise<ApiResponse<DrawingRevision[]>> {
    return this.client.request<ApiResponse<DrawingRevision[]>>(
      `${this.base}/${projectId}/drawing-sheets/${sheetId}/revisions`
    )
  }

  async getDrawingRevisionUploadUrl(
    projectId: string,
    sheetId: string,
    payload: { fileName: string; mimeType: string; fileSize: number }
  ): Promise<ApiResponse<UploadUrlResult>> {
    return this.client.request<ApiResponse<UploadUrlResult>>(
      `${this.base}/${projectId}/drawing-sheets/${sheetId}/revisions/upload-url`,
      { method: 'POST', body: JSON.stringify(payload) }
    )
  }

  async addDrawingRevision(
    projectId: string,
    sheetId: string,
    input: AddDrawingRevisionInput
  ): Promise<ApiResponse<DrawingRevision>> {
    return this.client.request<ApiResponse<DrawingRevision>>(
      `${this.base}/${projectId}/drawing-sheets/${sheetId}/revisions`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async deleteDrawingRevision(
    projectId: string,
    sheetId: string,
    revisionId: string
  ): Promise<void> {
    return this.client.request<void>(
      `${this.base}/${projectId}/drawing-sheets/${sheetId}/revisions/${revisionId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Specification Sections ────────────────────────────────────────────────

  async listSpecSections(projectId: string): Promise<ApiResponse<SpecificationSectionWithRevision[]>> {
    return this.client.request<ApiResponse<SpecificationSectionWithRevision[]>>(
      `${this.base}/${projectId}/spec-sections`
    )
  }

  async createSpecSection(
    projectId: string,
    input: CreateSpecificationSectionInput
  ): Promise<ApiResponse<SpecificationSectionWithRevision>> {
    return this.client.request<ApiResponse<SpecificationSectionWithRevision>>(
      `${this.base}/${projectId}/spec-sections`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async updateSpecSection(
    projectId: string,
    sectionId: string,
    input: UpdateSpecificationSectionInput
  ): Promise<ApiResponse<SpecificationSectionWithRevision>> {
    return this.client.request<ApiResponse<SpecificationSectionWithRevision>>(
      `${this.base}/${projectId}/spec-sections/${sectionId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteSpecSection(projectId: string, sectionId: string): Promise<void> {
    return this.client.request<void>(`${this.base}/${projectId}/spec-sections/${sectionId}`, {
      method: 'DELETE',
    })
  }

  // ─── Specification Revisions ───────────────────────────────────────────────

  async listSpecRevisions(
    projectId: string,
    sectionId: string
  ): Promise<ApiResponse<SpecificationRevision[]>> {
    return this.client.request<ApiResponse<SpecificationRevision[]>>(
      `${this.base}/${projectId}/spec-sections/${sectionId}/revisions`
    )
  }

  async getSpecRevisionUploadUrl(
    projectId: string,
    sectionId: string,
    payload: { fileName: string; mimeType: string; fileSize: number }
  ): Promise<ApiResponse<UploadUrlResult>> {
    return this.client.request<ApiResponse<UploadUrlResult>>(
      `${this.base}/${projectId}/spec-sections/${sectionId}/revisions/upload-url`,
      { method: 'POST', body: JSON.stringify(payload) }
    )
  }

  async addSpecRevision(
    projectId: string,
    sectionId: string,
    input: AddSpecificationRevisionInput
  ): Promise<ApiResponse<SpecificationRevision>> {
    return this.client.request<ApiResponse<SpecificationRevision>>(
      `${this.base}/${projectId}/spec-sections/${sectionId}/revisions`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async deleteSpecRevision(
    projectId: string,
    sectionId: string,
    revisionId: string
  ): Promise<void> {
    return this.client.request<void>(
      `${this.base}/${projectId}/spec-sections/${sectionId}/revisions/${revisionId}`,
      { method: 'DELETE' }
    )
  }
}
