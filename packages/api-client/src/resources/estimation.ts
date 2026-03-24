import type { ProManageClient } from '../client'
import type {
  ApiResponse,
  BidResult,
  CreateBidResultInput,
  CreateEstimateInput,
  CreateEstimateItemInput,
  CreateEstimateItemVendorQuoteInput,
  Estimate,
  EstimateItemVendorQuote,
  EstimateItemWithQuotes,
  EstimateSummary,
  EstimateWithItems,
  UpdateBidResultInput,
  UpdateEstimateInput,
  UpdateEstimateItemInput,
} from '@promanage/core'

export class EstimationResource {
  private readonly base = '/api/v1/estimation'

  constructor(private readonly client: ProManageClient) {}

  // ─── Estimates ─────────────────────────────────────────────────────────────

  async listAll(): Promise<Estimate[]> {
    const res = await this.client.request<ApiResponse<Estimate[]>>(this.base)
    return res.data
  }

  async list(projectId: string): Promise<Estimate[]> {
    const res = await this.client.request<ApiResponse<Estimate[]>>(
      `${this.base}/${projectId}`
    )
    return res.data
  }

  async get(projectId: string, estimateId: string): Promise<EstimateWithItems> {
    const res = await this.client.request<ApiResponse<EstimateWithItems>>(
      `${this.base}/${projectId}/${estimateId}`
    )
    return res.data
  }

  async getSummary(projectId: string, estimateId: string): Promise<EstimateSummary> {
    const res = await this.client.request<ApiResponse<EstimateSummary>>(
      `${this.base}/${projectId}/${estimateId}/summary`
    )
    return res.data
  }

  async create(projectId: string, body: CreateEstimateInput): Promise<Estimate> {
    const res = await this.client.request<ApiResponse<Estimate>>(
      `${this.base}/${projectId}`,
      { method: 'POST', body }
    )
    return res.data
  }

  async update(projectId: string, estimateId: string, body: UpdateEstimateInput): Promise<Estimate> {
    const res = await this.client.request<ApiResponse<Estimate>>(
      `${this.base}/${projectId}/${estimateId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async delete(projectId: string, estimateId: string): Promise<void> {
    await this.client.request<void>(`${this.base}/${projectId}/${estimateId}`, { method: 'DELETE' })
  }

  // ─── Items ─────────────────────────────────────────────────────────────────

  async listItems(projectId: string, estimateId: string): Promise<EstimateItemWithQuotes[]> {
    const res = await this.client.request<ApiResponse<EstimateItemWithQuotes[]>>(
      `${this.base}/${projectId}/${estimateId}/items`
    )
    return res.data
  }

  async createItem(
    projectId: string,
    estimateId: string,
    body: CreateEstimateItemInput
  ): Promise<EstimateItemWithQuotes> {
    const res = await this.client.request<ApiResponse<EstimateItemWithQuotes>>(
      `${this.base}/${projectId}/${estimateId}/items`,
      { method: 'POST', body }
    )
    return res.data
  }

  async updateItem(
    projectId: string,
    estimateId: string,
    itemId: string,
    body: UpdateEstimateItemInput
  ): Promise<EstimateItemWithQuotes> {
    const res = await this.client.request<ApiResponse<EstimateItemWithQuotes>>(
      `${this.base}/${projectId}/${estimateId}/items/${itemId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteItem(projectId: string, estimateId: string, itemId: string): Promise<void> {
    await this.client.request<void>(
      `${this.base}/${projectId}/${estimateId}/items/${itemId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Vendor Quotes ─────────────────────────────────────────────────────────

  async listQuotes(
    projectId: string,
    estimateId: string,
    itemId: string
  ): Promise<EstimateItemVendorQuote[]> {
    const res = await this.client.request<ApiResponse<EstimateItemVendorQuote[]>>(
      `${this.base}/${projectId}/${estimateId}/items/${itemId}/quotes`
    )
    return res.data
  }

  async upsertQuote(
    projectId: string,
    estimateId: string,
    itemId: string,
    body: CreateEstimateItemVendorQuoteInput
  ): Promise<EstimateItemVendorQuote> {
    const res = await this.client.request<ApiResponse<EstimateItemVendorQuote>>(
      `${this.base}/${projectId}/${estimateId}/items/${itemId}/quotes`,
      { method: 'POST', body }
    )
    return res.data
  }

  async deleteQuote(
    projectId: string,
    estimateId: string,
    itemId: string,
    quoteId: string
  ): Promise<void> {
    await this.client.request<void>(
      `${this.base}/${projectId}/${estimateId}/items/${itemId}/quotes/${quoteId}`,
      { method: 'DELETE' }
    )
  }

  // ─── Bid Results ───────────────────────────────────────────────────────────

  async listBidResults(projectId: string, estimateId: string): Promise<BidResult[]> {
    const res = await this.client.request<ApiResponse<BidResult[]>>(
      `${this.base}/${projectId}/${estimateId}/bid-results`
    )
    return res.data
  }

  async createBidResult(
    projectId: string,
    estimateId: string,
    body: CreateBidResultInput
  ): Promise<BidResult> {
    const res = await this.client.request<ApiResponse<BidResult>>(
      `${this.base}/${projectId}/${estimateId}/bid-results`,
      { method: 'POST', body }
    )
    return res.data
  }

  async updateBidResult(
    projectId: string,
    estimateId: string,
    resultId: string,
    body: UpdateBidResultInput
  ): Promise<BidResult> {
    const res = await this.client.request<ApiResponse<BidResult>>(
      `${this.base}/${projectId}/${estimateId}/bid-results/${resultId}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteBidResult(
    projectId: string,
    estimateId: string,
    resultId: string
  ): Promise<void> {
    await this.client.request<void>(
      `${this.base}/${projectId}/${estimateId}/bid-results/${resultId}`,
      { method: 'DELETE' }
    )
  }
}
