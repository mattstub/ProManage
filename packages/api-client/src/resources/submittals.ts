import type { ProManageClient } from '../client'
import type {
  ApiResponse,
  CreateSubmittalDocumentInput,
  CreateSubmittalInput,
  Submittal,
  SubmittalDocument,
  UpdateSubmittalDocumentInput,
  UpdateSubmittalInput,
} from '@promanage/core'

export interface ListSubmittalsParams {
  projectId: string
}

export interface UploadUrlResult {
  url: string
  fileKey: string
}

export class SubmittalsResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Submittals ────────────────────────────────────────────────────────────

  async list(params: ListSubmittalsParams): Promise<Submittal[]> {
    const res = await this.client.request<ApiResponse<Submittal[]>>(
      `/api/v1/submittals?projectId=${encodeURIComponent(params.projectId)}`
    )
    return res.data
  }

  async get(id: string): Promise<Submittal> {
    const res = await this.client.request<ApiResponse<Submittal>>(`/api/v1/submittals/${id}`)
    return res.data
  }

  async create(body: CreateSubmittalInput): Promise<Submittal> {
    const res = await this.client.request<ApiResponse<Submittal>>('/api/v1/submittals', {
      method: 'POST',
      body,
    })
    return res.data
  }

  async update(id: string, body: UpdateSubmittalInput): Promise<Submittal> {
    const res = await this.client.request<ApiResponse<Submittal>>(`/api/v1/submittals/${id}`, {
      method: 'PATCH',
      body,
    })
    return res.data
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/submittals/${id}`, { method: 'DELETE' })
  }

  // ─── Submittal Documents ───────────────────────────────────────────────────

  async listDocuments(submittalId: string): Promise<SubmittalDocument[]> {
    const res = await this.client.request<ApiResponse<SubmittalDocument[]>>(
      `/api/v1/submittals/${submittalId}/documents`
    )
    return res.data
  }

  async createDocument(
    submittalId: string,
    body: CreateSubmittalDocumentInput
  ): Promise<SubmittalDocument> {
    const res = await this.client.request<ApiResponse<SubmittalDocument>>(
      `/api/v1/submittals/${submittalId}/documents`,
      { method: 'POST', body }
    )
    return res.data
  }

  async updateDocument(
    submittalId: string,
    docId: string,
    body: UpdateSubmittalDocumentInput
  ): Promise<SubmittalDocument> {
    const res = await this.client.request<ApiResponse<SubmittalDocument>>(
      `/api/v1/submittals/${submittalId}/documents/${docId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteDocument(submittalId: string, docId: string): Promise<void> {
    await this.client.request<void>(`/api/v1/submittals/${submittalId}/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  async getDocumentUploadUrl(submittalId: string, docId: string): Promise<UploadUrlResult> {
    const res = await this.client.request<ApiResponse<UploadUrlResult>>(
      `/api/v1/submittals/${submittalId}/documents/${docId}/upload-url`,
      { method: 'POST' }
    )
    return res.data
  }

  async getDocumentDownloadUrl(submittalId: string, docId: string): Promise<{ url: string }> {
    const res = await this.client.request<ApiResponse<{ url: string }>>(
      `/api/v1/submittals/${submittalId}/documents/${docId}/download-url`
    )
    return res.data
  }
}
