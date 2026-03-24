import type { ProManageClient } from '../client'
import type {
  ApiResponse,
  CreateProposalInput,
  CreateProposalTemplateInput,
  ProposalStatus,
  ProposalTemplate,
  ProposalWithRelations,
  UpdateProposalInput,
  UpdateProposalTemplateInput,
  UpsertProposalLineItemsInput,
} from '@promanage/core'

export interface ListProposalsParams {
  status?: ProposalStatus
  projectId?: string
  customerId?: string
}

export class ProposalsResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Proposals ─────────────────────────────────────────────────────────────

  async list(params?: ListProposalsParams): Promise<ProposalWithRelations[]> {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.projectId) query.set('projectId', params.projectId)
    if (params?.customerId) query.set('customerId', params.customerId)
    const qs = query.toString()
    const res = await this.client.request<ApiResponse<ProposalWithRelations[]>>(
      `/api/v1/proposals${qs ? `?${qs}` : ''}`
    )
    return res.data
  }

  async get(id: string): Promise<ProposalWithRelations> {
    const res = await this.client.request<ApiResponse<ProposalWithRelations>>(
      `/api/v1/proposals/${id}`
    )
    return res.data
  }

  async create(body: CreateProposalInput): Promise<ProposalWithRelations> {
    const res = await this.client.request<ApiResponse<ProposalWithRelations>>(
      '/api/v1/proposals',
      { method: 'POST', body }
    )
    return res.data
  }

  async update(id: string, body: UpdateProposalInput): Promise<ProposalWithRelations> {
    const res = await this.client.request<ApiResponse<ProposalWithRelations>>(
      `/api/v1/proposals/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async delete(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/proposals/${id}`, { method: 'DELETE' })
  }

  async upsertLineItems(id: string, body: UpsertProposalLineItemsInput): Promise<ProposalWithRelations> {
    const res = await this.client.request<ApiResponse<ProposalWithRelations>>(
      `/api/v1/proposals/${id}/line-items`,
      { method: 'PUT', body }
    )
    return res.data
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  async listTemplates(activeOnly = false): Promise<ProposalTemplate[]> {
    const res = await this.client.request<ApiResponse<ProposalTemplate[]>>(
      `/api/v1/proposals/templates${activeOnly ? '?activeOnly=true' : ''}`
    )
    return res.data
  }

  async getTemplate(id: string): Promise<ProposalTemplate> {
    const res = await this.client.request<ApiResponse<ProposalTemplate>>(
      `/api/v1/proposals/templates/${id}`
    )
    return res.data
  }

  async createTemplate(body: CreateProposalTemplateInput): Promise<ProposalTemplate> {
    const res = await this.client.request<ApiResponse<ProposalTemplate>>(
      '/api/v1/proposals/templates',
      { method: 'POST', body }
    )
    return res.data
  }

  async updateTemplate(id: string, body: UpdateProposalTemplateInput): Promise<ProposalTemplate> {
    const res = await this.client.request<ApiResponse<ProposalTemplate>>(
      `/api/v1/proposals/templates/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/proposals/templates/${id}`, { method: 'DELETE' })
  }
}
