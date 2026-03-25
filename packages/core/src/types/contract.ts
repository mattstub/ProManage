export type ContractType = 'LUMP_SUM' | 'COST_PLUS' | 'TIME_AND_MATERIALS' | 'UNIT_PRICE'

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'TERMINATED'
  | 'ON_HOLD'

export type ContractDocumentType =
  | 'INSURANCE'
  | 'BONDING'
  | 'SALES_TAX_REQUEST'
  | 'SALES_TAX_EXEMPTION'
  | 'OTHER'

export type ContractDocumentStatus = 'REQUESTED' | 'RECEIVED' | 'EXPIRED' | 'WAIVED'

export interface Contract {
  id: string
  contractNumber: string
  type: ContractType
  status: ContractStatus
  amount: string // Decimal serialized as string
  customerProjectNumber: string | null
  retentionRate: string | null
  wageRequirements: string | null
  taxStatus: string | null
  liquidatedDamages: boolean
  liquidatedDamagesRate: string | null
  bonded: boolean
  billingDate: string | null
  startDate: string | null
  executedDate: string | null
  description: string | null
  notes: string | null
  organizationId: string
  projectId: string
  proposalId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  project?: { id: string; name: string; number: string }
  proposal?: { id: string; title: string; proposalNumber: number } | null
  createdBy?: { id: string; firstName: string; lastName: string; email: string }
  documents?: ContractDocument[]
}

export interface ContractDocument {
  id: string
  type: ContractDocumentType
  name: string
  status: ContractDocumentStatus
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  notes: string | null
  expiresAt: string | null
  receivedAt: string | null
  contractId: string
  uploadedById: string | null
  createdAt: string
  updatedAt: string
  uploadedBy?: { id: string; firstName: string; lastName: string } | null
}

export interface CreateContractInput {
  projectId: string
  proposalId?: string
  contractNumber: string
  type: ContractType
  amount: number
  customerProjectNumber?: string
  retentionRate?: number
  wageRequirements?: string
  taxStatus?: string
  liquidatedDamages?: boolean
  liquidatedDamagesRate?: number
  bonded?: boolean
  billingDate?: string
  startDate?: string
  executedDate?: string
  description?: string
  notes?: string
}

export interface UpdateContractInput {
  contractNumber?: string
  type?: ContractType
  status?: ContractStatus
  amount?: number
  customerProjectNumber?: string
  retentionRate?: number
  wageRequirements?: string
  taxStatus?: string
  liquidatedDamages?: boolean
  liquidatedDamagesRate?: number
  bonded?: boolean
  billingDate?: string
  startDate?: string
  executedDate?: string
  description?: string
  notes?: string
}

export interface CreateContractDocumentInput {
  type: ContractDocumentType
  name: string
  notes?: string
  expiresAt?: string
}

export interface UpdateContractDocumentInput {
  type?: ContractDocumentType
  name?: string
  status?: ContractDocumentStatus
  notes?: string
  expiresAt?: string
  receivedAt?: string
}
