import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  SafetyDocument,
  SafetyDocumentCategory,
  CreateSafetyDocumentInput,
  UpdateSafetyDocumentInput,
  SdsEntry,
  CreateSdsEntryInput,
  UpdateSdsEntryInput,
  ToolboxTalk,
  ToolboxTalkAttendee,
  ToolboxTalkStatus,
  CreateToolboxTalkInput,
  UpdateToolboxTalkInput,
  CreateToolboxTalkAttendeeInput,
  SafetyForm,
  SafetyFormCategory,
  CreateSafetyFormInput,
  UpdateSafetyFormInput,
  IncidentReport,
  IncidentType,
  IncidentStatus,
  CreateIncidentReportInput,
  UpdateIncidentReportInput,
} from '@promanage/core'

export interface ListSafetyDocumentsParams {
  page?: number
  perPage?: number
  search?: string
  category?: SafetyDocumentCategory
}

export interface ListSdsEntriesParams {
  page?: number
  perPage?: number
  search?: string
}

export interface ListToolboxTalksParams {
  page?: number
  perPage?: number
  search?: string
  status?: ToolboxTalkStatus
  projectId?: string
}

export interface ListSafetyFormsParams {
  page?: number
  perPage?: number
  search?: string
  category?: SafetyFormCategory
  isActive?: boolean
}

export interface ListIncidentReportsParams {
  page?: number
  perPage?: number
  search?: string
  incidentType?: IncidentType
  status?: IncidentStatus
  projectId?: string
}

export class SafetyResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Safety Documents ───────────────────────────────────────────────────────

  /** List safety documents for the current organization (paginated). */
  async listDocuments(params?: ListSafetyDocumentsParams): Promise<PaginatedResult<SafetyDocument>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)

    const qs = query.toString()
    return this.client.request<PaginatedResult<SafetyDocument>>(
      `/api/v1/safety/documents${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single safety document by ID. */
  async getDocument(id: string): Promise<SafetyDocument> {
    const res = await this.client.request<ApiResponse<SafetyDocument>>(
      `/api/v1/safety/documents/${id}`
    )
    return res.data
  }

  /** Request a presigned URL to upload a safety document to MinIO. */
  async getDocumentUploadUrl(
    file: { fileName: string; mimeType: string; fileSize: number }
  ): Promise<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }> {
    const res = await this.client.request<ApiResponse<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }>>(
      '/api/v1/safety/documents/upload-url',
      { method: 'POST', body: file }
    )
    return res.data
  }

  /** Confirm a completed upload and create the document DB record. */
  async createDocument(body: CreateSafetyDocumentInput): Promise<SafetyDocument> {
    const res = await this.client.request<ApiResponse<SafetyDocument>>(
      '/api/v1/safety/documents',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a safety document's metadata. Requires write role. */
  async updateDocument(id: string, body: UpdateSafetyDocumentInput): Promise<SafetyDocument> {
    const res = await this.client.request<ApiResponse<SafetyDocument>>(
      `/api/v1/safety/documents/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a safety document. Requires Admin or OfficeAdmin role. */
  async deleteDocument(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/safety/documents/${id}`, { method: 'DELETE' })
  }

  // ─── SDS Catalog ────────────────────────────────────────────────────────────

  /** List SDS entries for the current organization (paginated). */
  async listSds(params?: ListSdsEntriesParams): Promise<PaginatedResult<SdsEntry>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)

    const qs = query.toString()
    return this.client.request<PaginatedResult<SdsEntry>>(
      `/api/v1/safety/sds${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single SDS entry by ID. */
  async getSds(id: string): Promise<SdsEntry> {
    const res = await this.client.request<ApiResponse<SdsEntry>>(
      `/api/v1/safety/sds/${id}`
    )
    return res.data
  }

  /** Request a presigned URL to upload an SDS file to MinIO. */
  async getSdsUploadUrl(
    file: { fileName: string; mimeType: string; fileSize: number }
  ): Promise<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }> {
    const res = await this.client.request<ApiResponse<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }>>(
      '/api/v1/safety/sds/upload-url',
      { method: 'POST', body: file }
    )
    return res.data
  }

  /** Create a new SDS entry. */
  async createSds(body: CreateSdsEntryInput): Promise<SdsEntry> {
    const res = await this.client.request<ApiResponse<SdsEntry>>(
      '/api/v1/safety/sds',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update an SDS entry. Requires write role. */
  async updateSds(id: string, body: UpdateSdsEntryInput): Promise<SdsEntry> {
    const res = await this.client.request<ApiResponse<SdsEntry>>(
      `/api/v1/safety/sds/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete an SDS entry. Requires Admin or OfficeAdmin role. */
  async deleteSds(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/safety/sds/${id}`, { method: 'DELETE' })
  }

  /** Get a presigned download URL for an SDS file. */
  async getSdsDownloadUrl(id: string): Promise<{ downloadUrl: string; fileName: string }> {
    const res = await this.client.request<ApiResponse<{ downloadUrl: string; fileName: string }>>(
      `/api/v1/safety/sds/${id}/download-url`
    )
    return res.data
  }

  // ─── Toolbox Talks ───────────────────────────────────────────────────────────

  /** List toolbox talks for the current organization (paginated). */
  async listTalks(params?: ListToolboxTalksParams): Promise<PaginatedResult<ToolboxTalk>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.projectId) query.set('projectId', params.projectId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<ToolboxTalk>>(
      `/api/v1/safety/toolbox-talks${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single toolbox talk by ID. */
  async getTalk(id: string): Promise<ToolboxTalk> {
    const res = await this.client.request<ApiResponse<ToolboxTalk>>(
      `/api/v1/safety/toolbox-talks/${id}`
    )
    return res.data
  }

  /** Create a new toolbox talk. Requires write role. */
  async createTalk(body: CreateToolboxTalkInput): Promise<ToolboxTalk> {
    const res = await this.client.request<ApiResponse<ToolboxTalk>>(
      '/api/v1/safety/toolbox-talks',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a toolbox talk. Requires write role. */
  async updateTalk(id: string, body: UpdateToolboxTalkInput): Promise<ToolboxTalk> {
    const res = await this.client.request<ApiResponse<ToolboxTalk>>(
      `/api/v1/safety/toolbox-talks/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a toolbox talk. Requires Admin or OfficeAdmin role. */
  async deleteTalk(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/safety/toolbox-talks/${id}`, { method: 'DELETE' })
  }

  /** Add an attendee to a toolbox talk. */
  async addAttendee(talkId: string, body: CreateToolboxTalkAttendeeInput): Promise<ToolboxTalkAttendee> {
    const res = await this.client.request<ApiResponse<ToolboxTalkAttendee>>(
      `/api/v1/safety/toolbox-talks/${talkId}/attendees`,
      { method: 'POST', body }
    )
    return res.data
  }

  /** Remove an attendee from a toolbox talk. Requires write role. */
  async removeAttendee(talkId: string, attendeeId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/safety/toolbox-talks/${talkId}/attendees/${attendeeId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Safety Forms ────────────────────────────────────────────────────────────

  /** List safety forms for the current organization (paginated). */
  async listForms(params?: ListSafetyFormsParams): Promise<PaginatedResult<SafetyForm>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))

    const qs = query.toString()
    return this.client.request<PaginatedResult<SafetyForm>>(
      `/api/v1/safety/forms${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single safety form by ID. */
  async getForm(id: string): Promise<SafetyForm> {
    const res = await this.client.request<ApiResponse<SafetyForm>>(
      `/api/v1/safety/forms/${id}`
    )
    return res.data
  }

  /** Create a new safety form. Requires write role. */
  async createForm(body: CreateSafetyFormInput): Promise<SafetyForm> {
    const res = await this.client.request<ApiResponse<SafetyForm>>(
      '/api/v1/safety/forms',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a safety form. Requires write role. */
  async updateForm(id: string, body: UpdateSafetyFormInput): Promise<SafetyForm> {
    const res = await this.client.request<ApiResponse<SafetyForm>>(
      `/api/v1/safety/forms/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a safety form. Requires Admin or OfficeAdmin role. */
  async deleteForm(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/safety/forms/${id}`, { method: 'DELETE' })
  }

  // ─── Incident Reports ────────────────────────────────────────────────────────

  /** List incident reports for the current organization (paginated). Requires elevated role. */
  async listIncidents(params?: ListIncidentReportsParams): Promise<PaginatedResult<IncidentReport>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.incidentType) query.set('incidentType', params.incidentType)
    if (params?.status) query.set('status', params.status)
    if (params?.projectId) query.set('projectId', params.projectId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<IncidentReport>>(
      `/api/v1/safety/incidents${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single incident report by ID. Requires elevated role. */
  async getIncident(id: string): Promise<IncidentReport> {
    const res = await this.client.request<ApiResponse<IncidentReport>>(
      `/api/v1/safety/incidents/${id}`
    )
    return res.data
  }

  /** Create (report) a new incident. Open to all authenticated users. */
  async createIncident(body: CreateIncidentReportInput): Promise<IncidentReport> {
    const res = await this.client.request<ApiResponse<IncidentReport>>(
      '/api/v1/safety/incidents',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update an incident report. Requires write role. */
  async updateIncident(id: string, body: UpdateIncidentReportInput): Promise<IncidentReport> {
    const res = await this.client.request<ApiResponse<IncidentReport>>(
      `/api/v1/safety/incidents/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete an incident report. Requires Admin or OfficeAdmin role. */
  async deleteIncident(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/safety/incidents/${id}`, { method: 'DELETE' })
  }
}
