export type EstimateStatus = 'DRAFT' | 'ACTIVE' | 'AWARDED' | 'LOST'

export type EstimateUnit =
  | 'EA'
  | 'LF'
  | 'SF'
  | 'SY'
  | 'CY'
  | 'TON'
  | 'LS'
  | 'HR'
  | 'DAY'
  | 'MGAL'
  | 'GAL'

export interface Estimate {
  id: string
  name: string
  description: string | null
  notes: string | null
  status: EstimateStatus
  bidDueDate: string | null
  totalCost: string
  organizationId: string
  projectId: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface EstimateWithItems extends Estimate {
  items: EstimateItemWithQuotes[]
  bidResults: BidResult[]
}

export interface EstimateItem {
  id: string
  description: string
  quantity: string
  unit: EstimateUnit
  unitCost: string
  totalCost: string
  costCode: string | null
  sortOrder: number
  notes: string | null
  estimateId: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface EstimateItemWithQuotes extends EstimateItem {
  vendorQuotes: EstimateItemVendorQuote[]
}

export interface EstimateItemVendorQuote {
  id: string
  unitPrice: string
  totalPrice: string
  notes: string | null
  quotedAt: string
  estimateItemId: string
  vendorId: string
  organizationId: string
  createdAt: string
  updatedAt: string
  vendor: {
    id: string
    firstName: string
    lastName: string
    company: string | null
  }
}

export interface BidResult {
  id: string
  competitorName: string
  bidAmount: string
  notes: string | null
  isAwarded: boolean
  submittedAt: string
  estimateId: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface EstimateSummary {
  estimateId: string
  totalCost: string
  itemCount: number
  vendorQuoteCount: number
}

export interface CreateEstimateInput {
  name: string
  description?: string | null
  notes?: string | null
  status?: EstimateStatus
  bidDueDate?: string | null
}

export interface UpdateEstimateInput {
  name?: string
  description?: string | null
  notes?: string | null
  status?: EstimateStatus
  bidDueDate?: string | null
}

export interface CreateEstimateItemInput {
  description: string
  quantity: number
  unit?: EstimateUnit
  unitCost: number
  costCode?: string | null
  sortOrder?: number
  notes?: string | null
}

export interface UpdateEstimateItemInput {
  description?: string
  quantity?: number
  unit?: EstimateUnit
  unitCost?: number
  costCode?: string | null
  sortOrder?: number
  notes?: string | null
}

export interface CreateEstimateItemVendorQuoteInput {
  vendorId: string
  unitPrice: number
  notes?: string | null
  quotedAt: string
}

export interface CreateBidResultInput {
  competitorName: string
  bidAmount: number
  notes?: string | null
  isAwarded?: boolean
  submittedAt: string
}

export interface UpdateBidResultInput {
  competitorName?: string
  bidAmount?: number
  notes?: string | null
  isAwarded?: boolean
  submittedAt?: string
}
