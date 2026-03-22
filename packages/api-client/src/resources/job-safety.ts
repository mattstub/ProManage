import type { ProManageClient } from '../client'
import type { PaginatedResult, PaginationParams } from '../types'
import type {
  AddProjectSdsEntryInput,
  ApiResponse,
  CreateJobHazardAnalysisInput,
  CreateProjectEmergencyContactInput,
  JobHazardAnalysis,
  ProjectEmergencyContact,
  ProjectSdsEntry,
  SafetyDocument,
  IncidentReport,
  ToolboxTalk,
  UpdateJobHazardAnalysisInput,
  UpdateProjectEmergencyContactInput,
  UpdateProjectSdsEntryInput,
} from '@promanage/core'

export interface JhaUploadUrlResult {
  uploadUrl: string
  objectKey: string
}

export interface ListJhasParams extends PaginationParams {
  search?: string
  status?: string
}

export interface ListProjectSdsParams extends PaginationParams {
  search?: string
}

export class JobSafetyResource {
  constructor(private readonly client: ProManageClient) {}

  private base(projectId: string) {
    return `/api/v1/projects/${projectId}/safety`
  }

  // ─── JHAs ──────────────────────────────────────────────────────────────────

  async listJhas(
    projectId: string,
    params?: ListJhasParams
  ): Promise<PaginatedResult<JobHazardAnalysis>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.perPage) qs.set('perPage', String(params.perPage))
    if (params?.search) qs.set('search', params.search)
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString() ? `?${qs}` : ''
    return this.client.request<PaginatedResult<JobHazardAnalysis>>(
      `${this.base(projectId)}/jhas${query}`
    )
  }

  async getJha(projectId: string, jhaId: string): Promise<ApiResponse<JobHazardAnalysis>> {
    return this.client.request<ApiResponse<JobHazardAnalysis>>(
      `${this.base(projectId)}/jhas/${jhaId}`
    )
  }

  async getJhaUploadUrl(
    projectId: string,
    fileName: string,
    mimeType: string
  ): Promise<ApiResponse<JhaUploadUrlResult>> {
    const qs = new URLSearchParams({ fileName, mimeType })
    return this.client.request<ApiResponse<JhaUploadUrlResult>>(
      `${this.base(projectId)}/jhas/upload-url?${qs}`
    )
  }

  async getJhaDownloadUrl(
    projectId: string,
    jhaId: string
  ): Promise<ApiResponse<{ downloadUrl: string; fileName: string | null }>> {
    return this.client.request<ApiResponse<{ downloadUrl: string; fileName: string | null }>>(
      `${this.base(projectId)}/jhas/${jhaId}/download-url`
    )
  }

  async createJha(
    projectId: string,
    input: CreateJobHazardAnalysisInput
  ): Promise<ApiResponse<JobHazardAnalysis>> {
    return this.client.request<ApiResponse<JobHazardAnalysis>>(
      `${this.base(projectId)}/jhas`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async updateJha(
    projectId: string,
    jhaId: string,
    input: UpdateJobHazardAnalysisInput
  ): Promise<ApiResponse<JobHazardAnalysis>> {
    return this.client.request<ApiResponse<JobHazardAnalysis>>(
      `${this.base(projectId)}/jhas/${jhaId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteJha(projectId: string, jhaId: string): Promise<void> {
    return this.client.request<void>(`${this.base(projectId)}/jhas/${jhaId}`, { method: 'DELETE' })
  }

  // ─── Emergency Contacts ────────────────────────────────────────────────────

  async listEmergencyContacts(projectId: string): Promise<ApiResponse<ProjectEmergencyContact[]>> {
    return this.client.request<ApiResponse<ProjectEmergencyContact[]>>(
      `${this.base(projectId)}/emergency-contacts`
    )
  }

  async getEmergencyContact(
    projectId: string,
    contactId: string
  ): Promise<ApiResponse<ProjectEmergencyContact>> {
    return this.client.request<ApiResponse<ProjectEmergencyContact>>(
      `${this.base(projectId)}/emergency-contacts/${contactId}`
    )
  }

  async createEmergencyContact(
    projectId: string,
    input: CreateProjectEmergencyContactInput
  ): Promise<ApiResponse<ProjectEmergencyContact>> {
    return this.client.request<ApiResponse<ProjectEmergencyContact>>(
      `${this.base(projectId)}/emergency-contacts`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async updateEmergencyContact(
    projectId: string,
    contactId: string,
    input: UpdateProjectEmergencyContactInput
  ): Promise<ApiResponse<ProjectEmergencyContact>> {
    return this.client.request<ApiResponse<ProjectEmergencyContact>>(
      `${this.base(projectId)}/emergency-contacts/${contactId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async deleteEmergencyContact(projectId: string, contactId: string): Promise<void> {
    return this.client.request<void>(
      `${this.base(projectId)}/emergency-contacts/${contactId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Project SDS Binder ────────────────────────────────────────────────────

  async listProjectSdsEntries(
    projectId: string,
    params?: ListProjectSdsParams
  ): Promise<PaginatedResult<ProjectSdsEntry>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.perPage) qs.set('perPage', String(params.perPage))
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString() ? `?${qs}` : ''
    return this.client.request<PaginatedResult<ProjectSdsEntry>>(
      `${this.base(projectId)}/sds${query}`
    )
  }

  async addProjectSdsEntry(
    projectId: string,
    input: AddProjectSdsEntryInput
  ): Promise<ApiResponse<ProjectSdsEntry>> {
    return this.client.request<ApiResponse<ProjectSdsEntry>>(
      `${this.base(projectId)}/sds`,
      { method: 'POST', body: JSON.stringify(input) }
    )
  }

  async updateProjectSdsEntry(
    projectId: string,
    entryId: string,
    input: UpdateProjectSdsEntryInput
  ): Promise<ApiResponse<ProjectSdsEntry>> {
    return this.client.request<ApiResponse<ProjectSdsEntry>>(
      `${this.base(projectId)}/sds/${entryId}`,
      { method: 'PATCH', body: JSON.stringify(input) }
    )
  }

  async removeProjectSdsEntry(projectId: string, entryId: string): Promise<void> {
    return this.client.request<void>(
      `${this.base(projectId)}/sds/${entryId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Project-scoped safety read views ─────────────────────────────────────

  async listProjectSafetyDocuments(
    projectId: string,
    params?: PaginationParams & { search?: string; category?: string }
  ): Promise<PaginatedResult<SafetyDocument>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.perPage) qs.set('perPage', String(params.perPage))
    if (params?.search) qs.set('search', params.search)
    if (params?.category) qs.set('category', params.category)
    const query = qs.toString() ? `?${qs}` : ''
    return this.client.request<PaginatedResult<SafetyDocument>>(
      `${this.base(projectId)}/documents${query}`
    )
  }

  async listProjectToolboxTalks(
    projectId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResult<ToolboxTalk>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.perPage) qs.set('perPage', String(params.perPage))
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString() ? `?${qs}` : ''
    return this.client.request<PaginatedResult<ToolboxTalk>>(
      `${this.base(projectId)}/toolbox-talks${query}`
    )
  }

  async listProjectIncidents(
    projectId: string,
    params?: PaginationParams & { status?: string; incidentType?: string }
  ): Promise<PaginatedResult<IncidentReport>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.perPage) qs.set('perPage', String(params.perPage))
    if (params?.status) qs.set('status', params.status)
    if (params?.incidentType) qs.set('incidentType', params.incidentType)
    const query = qs.toString() ? `?${qs}` : ''
    return this.client.request<PaginatedResult<IncidentReport>>(
      `${this.base(projectId)}/incidents${query}`
    )
  }
}
