import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  LicenseHolderType,
  LicenseStatus,
  LicenseWithRelations,
  LicenseDocument,
  LicenseReminder,
  LicenseUserSummary,
  CreateLicenseInput,
  UpdateLicenseInput,
  CreateLicenseReminderInput,
  UpdateLicenseReminderInput,
} from '@promanage/core'

export interface ListLicensesParams {
  page?: number
  perPage?: number
  search?: string
  holderType?: LicenseHolderType
  status?: LicenseStatus
  userId?: string
}

export interface LicenseReminderWithRelations extends LicenseReminder {
  notifyUser: LicenseUserSummary
  notifySupervisor: LicenseUserSummary | null
}

export class LicensesResource {
  constructor(private readonly client: ProManageClient) {}

  /** List licenses for the current organization (paginated). */
  async list(params?: ListLicensesParams): Promise<PaginatedResult<LicenseWithRelations>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.holderType) query.set('holderType', params.holderType)
    if (params?.status) query.set('status', params.status)
    if (params?.userId) query.set('userId', params.userId)

    const qs = query.toString()
    return this.client.request<PaginatedResult<LicenseWithRelations>>(
      `/api/v1/licenses${qs ? `?${qs}` : ''}`
    )
  }

  /** Get a single license by ID. */
  async get(id: string): Promise<LicenseWithRelations> {
    const res = await this.client.request<ApiResponse<LicenseWithRelations>>(
      `/api/v1/licenses/${id}`
    )
    return res.data
  }

  /** Create a new license. Requires Admin or OfficeAdmin role. */
  async create(body: CreateLicenseInput): Promise<LicenseWithRelations> {
    const res = await this.client.request<ApiResponse<LicenseWithRelations>>(
      '/api/v1/licenses',
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a license. Requires Admin or OfficeAdmin role. */
  async update(id: string, body: UpdateLicenseInput): Promise<LicenseWithRelations> {
    const res = await this.client.request<ApiResponse<LicenseWithRelations>>(
      `/api/v1/licenses/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a license. Requires Admin role. */
  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/licenses/${id}`, { method: 'DELETE' })
  }

  // ─── Documents ─────────────────────────────────────────────────────────────

  /** Request a presigned URL to upload a document to MinIO. */
  async getDocumentUploadUrl(
    licenseId: string,
    file: { fileName: string; mimeType: string; fileSize: number }
  ): Promise<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }> {
    const res = await this.client.request<ApiResponse<{ uploadUrl: string; fileKey: string; fileName: string; mimeType: string; fileSize: number }>>(
      `/api/v1/licenses/${licenseId}/documents/upload-url`,
      { method: 'POST', body: file }
    )
    return res.data
  }

  /** Confirm a completed upload and create the document DB record. */
  async confirmDocumentUpload(
    licenseId: string,
    body: { fileName: string; fileKey: string; fileSize: number; mimeType: string; documentTag?: string }
  ): Promise<LicenseDocument> {
    const res = await this.client.request<ApiResponse<LicenseDocument>>(
      `/api/v1/licenses/${licenseId}/documents`,
      { method: 'POST', body }
    )
    return res.data
  }

  /** Delete a document. Requires Admin or OfficeAdmin role. */
  async deleteDocument(licenseId: string, docId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/licenses/${licenseId}/documents/${docId}`,
      { method: 'DELETE' }
    )
  }

  /** Get a presigned download URL for a document. */
  async getDocumentDownloadUrl(
    licenseId: string,
    docId: string
  ): Promise<{ downloadUrl: string; fileName: string }> {
    const res = await this.client.request<ApiResponse<{ downloadUrl: string; fileName: string }>>(
      `/api/v1/licenses/${licenseId}/documents/${docId}/download-url`
    )
    return res.data
  }

  // ─── Reminders ─────────────────────────────────────────────────────────────

  /** Create a renewal reminder. Requires Admin, OfficeAdmin, or ProjectManager role. */
  async createReminder(
    licenseId: string,
    body: CreateLicenseReminderInput
  ): Promise<LicenseReminderWithRelations> {
    const res = await this.client.request<ApiResponse<LicenseReminderWithRelations>>(
      `/api/v1/licenses/${licenseId}/reminders`,
      { method: 'POST', body }
    )
    return res.data
  }

  /** Update a reminder. Requires Admin, OfficeAdmin, or ProjectManager role. */
  async updateReminder(
    licenseId: string,
    reminderId: string,
    body: UpdateLicenseReminderInput
  ): Promise<LicenseReminderWithRelations> {
    const res = await this.client.request<ApiResponse<LicenseReminderWithRelations>>(
      `/api/v1/licenses/${licenseId}/reminders/${reminderId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  /** Delete a reminder. Requires Admin, OfficeAdmin, or ProjectManager role. */
  async deleteReminder(licenseId: string, reminderId: string): Promise<void> {
    await this.client.request<void>(
      `/api/v1/licenses/${licenseId}/reminders/${reminderId}`,
      { method: 'DELETE' }
    )
  }
}
