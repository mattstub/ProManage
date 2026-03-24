export type MaterialUnit =
  | 'EA'
  | 'LF'
  | 'SF'
  | 'SY'
  | 'CY'
  | 'LB'
  | 'TON'
  | 'GAL'
  | 'HR'
  | 'LS'
  | 'BF'
  | 'MBF'

export interface CostCode {
  id: string
  organizationId: string
  code: string
  description: string
  division: string | null
  accountingRef: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCostCodeInput {
  code: string
  description: string
  division?: string
  accountingRef?: string
}

export interface UpdateCostCodeInput {
  code?: string
  description?: string
  division?: string | null
  accountingRef?: string | null
  isActive?: boolean
}

export interface MaterialPriceHistory {
  id: string
  materialId: string
  unitCost: string
  supplier: string | null
  notes: string | null
  recordedAt: string
  recordedBy: { id: string; firstName: string; lastName: string; email: string }
}

export interface Material {
  id: string
  organizationId: string
  name: string
  description: string | null
  sku: string | null
  unit: MaterialUnit
  unitCost: string
  supplier: string | null
  notes: string | null
  isActive: boolean
  lastPricedAt: string
  costCodeId: string | null
  costCode: { id: string; code: string; description: string } | null
  createdById: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialInput {
  name: string
  description?: string
  sku?: string
  unit?: MaterialUnit
  unitCost: number
  supplier?: string
  notes?: string
  costCodeId?: string
}

export interface UpdateMaterialInput {
  name?: string
  description?: string | null
  sku?: string | null
  unit?: MaterialUnit
  unitCost?: number
  supplier?: string | null
  notes?: string | null
  isActive?: boolean
  costCodeId?: string | null
}
