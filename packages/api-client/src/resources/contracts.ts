import type { ProManageClient } from '../client'
import type {
  ApiResponse,
  Contract,
  ContractDocument,
  CreateContractDocumentInput,
  CreateContractInput,
  UpdateContractDocumentInput,
  UpdateContractInput,
} from '@promanage/core'

export interface ListContractsParams {
  projectId: string
}

export interface UploadUrlResult {
  url: string
  fileKey: string
}

export class ContractsResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Contracts ─────────────────────────────────────────────────────────────

  async list(params: ListContractsParams): Promise<Contract[]> {
    const res = await this.client.request<ApiResponse<Contract[]>>(
      `/api/v1/contracts?projectId=${encodeURIComponent(params.projectId)}`
    )
    return res.data
  }

  async get(id: string): Promise<Contract> {
    const res = await this.client.request<ApiResponse<Contract>>(`/api/v1/contracts/${id}`)
    return res.data
  }

  async create(body: CreateContractInput): Promise<Contract> {
    const res = await this.client.request<ApiResponse<Contract>>('/api/v1/contracts', {
      method: 'POST',
      body,
    })
    return res.data
  }

  async update(id: string, body: UpdateContractInput): Promise<Contract> {
    const res = await this.client.request<ApiResponse<Contract>>(`/api/v1/contracts/${id}`, {
      method: 'PATCH',
      body,
    })
    return res.data
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/contracts/${id}`, { method: 'DELETE' })
  }

  // ─── Contract Documents ────────────────────────────────────────────────────

  async listDocuments(contractId: string): Promise<ContractDocument[]> {
    const res = await this.client.request<ApiResponse<ContractDocument[]>>(
      `/api/v1/contracts/${contractId}/documents`
    )
    return res.data
  }

  async createDocument(contractId: string, body: CreateContractDocumentInput): Promise<ContractDocument> {
    const res = await this.client.request<ApiResponse<ContractDocument>>(
      `/api/v1/contracts/${contractId}/documents`,
      { method: 'POST', body }
    )
    return res.data
  }

  async updateDocument(contractId: string, docId: string, body: UpdateContractDocumentInput): Promise<ContractDocument> {
    const res = await this.client.request<ApiResponse<ContractDocument>>(
      `/api/v1/contracts/${contractId}/documents/${docId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteDocument(contractId: string, docId: string): Promise<void> {
    await this.client.request<void>(`/api/v1/contracts/${contractId}/documents/${docId}`, {
      method: 'DELETE',
    })
  }

  async getDocumentUploadUrl(contractId: string, docId: string): Promise<UploadUrlResult> {
    const res = await this.client.request<ApiResponse<UploadUrlResult>>(
      `/api/v1/contracts/${contractId}/documents/${docId}/upload-url`,
      { method: 'POST' }
    )
    return res.data
  }

  async getDocumentDownloadUrl(contractId: string, docId: string): Promise<{ url: string }> {
    const res = await this.client.request<ApiResponse<{ url: string }>>(
      `/api/v1/contracts/${contractId}/documents/${docId}/download-url`
    )
    return res.data
  }
}
