import type { ProManageClient } from '../client'
import type { PaginatedResult } from '../types'
import type {
  ApiResponse,
  CostCode,
  CreateCostCodeInput,
  CreateMaterialInput,
  Material,
  MaterialPriceHistory,
  MaterialUnit,
  UpdateCostCodeInput,
  UpdateMaterialInput,
} from '@promanage/core'

export interface ListMaterialsParams {
  page?: number
  perPage?: number
  search?: string
  unit?: MaterialUnit
  costCodeId?: string
  isActive?: boolean
}

export class MaterialsResource {
  constructor(private readonly client: ProManageClient) {}

  // ─── Cost Codes ───────────────────────────────────────────────────────────

  async listCostCodes(params?: { search?: string; isActive?: boolean }): Promise<CostCode[]> {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
    const qs = query.toString()
    const res = await this.client.request<ApiResponse<CostCode[]>>(
      `/api/v1/materials/cost-codes${qs ? `?${qs}` : ''}`
    )
    return res.data
  }

  async createCostCode(body: CreateCostCodeInput): Promise<CostCode> {
    const res = await this.client.request<ApiResponse<CostCode>>(
      '/api/v1/materials/cost-codes',
      { method: 'POST', body }
    )
    return res.data
  }

  async updateCostCode(id: string, body: UpdateCostCodeInput): Promise<CostCode> {
    const res = await this.client.request<ApiResponse<CostCode>>(
      `/api/v1/materials/cost-codes/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteCostCode(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/materials/cost-codes/${id}`, { method: 'DELETE' })
  }

  // ─── Materials ────────────────────────────────────────────────────────────

  async listMaterials(params?: ListMaterialsParams): Promise<PaginatedResult<Material>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('perPage', String(params.perPage))
    if (params?.search) query.set('search', params.search)
    if (params?.unit) query.set('unit', params.unit)
    if (params?.costCodeId) query.set('costCodeId', params.costCodeId)
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive))
    const qs = query.toString()
    return this.client.request<PaginatedResult<Material>>(
      `/api/v1/materials${qs ? `?${qs}` : ''}`
    )
  }

  async getMaterial(id: string): Promise<Material> {
    const res = await this.client.request<ApiResponse<Material>>(`/api/v1/materials/${id}`)
    return res.data
  }

  async createMaterial(body: CreateMaterialInput): Promise<Material> {
    const res = await this.client.request<ApiResponse<Material>>(
      '/api/v1/materials',
      { method: 'POST', body }
    )
    return res.data
  }

  async updateMaterial(id: string, body: UpdateMaterialInput): Promise<Material> {
    const res = await this.client.request<ApiResponse<Material>>(
      `/api/v1/materials/${id}`,
      { method: 'PATCH', body }
    )
    return res.data
  }

  async deleteMaterial(id: string): Promise<void> {
    await this.client.request<void>(`/api/v1/materials/${id}`, { method: 'DELETE' })
  }

  async getMaterialPriceHistory(materialId: string): Promise<MaterialPriceHistory[]> {
    const res = await this.client.request<ApiResponse<MaterialPriceHistory[]>>(
      `/api/v1/materials/${materialId}/price-history`
    )
    return res.data
  }
}
