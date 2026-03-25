import type { ContractDocumentStatus, ContractDocumentType, ContractStatus, ContractType } from '../types/contract'

export const CONTRACT_TYPE_LIST: { value: ContractType; label: string }[] = [
  { value: 'LUMP_SUM', label: 'Lump Sum' },
  { value: 'COST_PLUS', label: 'Cost Plus' },
  { value: 'TIME_AND_MATERIALS', label: 'Time & Materials' },
  { value: 'UNIT_PRICE', label: 'Unit Price' },
]

export const CONTRACT_TYPES: Record<ContractType, string> = {
  LUMP_SUM: 'Lump Sum',
  COST_PLUS: 'Cost Plus',
  TIME_AND_MATERIALS: 'Time & Materials',
  UNIT_PRICE: 'Unit Price',
}

export const CONTRACT_STATUS_LIST: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_SIGNATURE', label: 'Pending Signature' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'ON_HOLD', label: 'On Hold' },
]

export const CONTRACT_STATUSES: Record<ContractStatus, string> = {
  DRAFT: 'Draft',
  PENDING_SIGNATURE: 'Pending Signature',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  ON_HOLD: 'On Hold',
}

export const CONTRACT_DOCUMENT_TYPE_LIST: { value: ContractDocumentType; label: string }[] = [
  { value: 'INSURANCE', label: 'Insurance Certificate' },
  { value: 'BONDING', label: 'Bond' },
  { value: 'SALES_TAX_REQUEST', label: 'Sales Tax Request' },
  { value: 'SALES_TAX_EXEMPTION', label: 'Sales Tax Exemption' },
  { value: 'OTHER', label: 'Other' },
]

export const CONTRACT_DOCUMENT_TYPES: Record<ContractDocumentType, string> = {
  INSURANCE: 'Insurance Certificate',
  BONDING: 'Bond',
  SALES_TAX_REQUEST: 'Sales Tax Request',
  SALES_TAX_EXEMPTION: 'Sales Tax Exemption',
  OTHER: 'Other',
}

export const CONTRACT_DOCUMENT_STATUS_LIST: { value: ContractDocumentStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'WAIVED', label: 'Waived' },
]

export const CONTRACT_DOCUMENT_STATUSES: Record<ContractDocumentStatus, string> = {
  REQUESTED: 'Requested',
  RECEIVED: 'Received',
  EXPIRED: 'Expired',
  WAIVED: 'Waived',
}
