export type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'REVISED'

export interface ProposalLineItem {
  id: string
  proposalId: string
  description: string
  quantity: string
  unit: string | null
  unitPrice: string
  totalPrice: string
  sortOrder: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Proposal {
  id: string
  proposalNumber: number
  title: string
  status: ProposalStatus
  coverLetter: string | null
  terms: string | null
  validUntil: string | null
  submittedAt: string | null
  estimateId: string | null
  organizationId: string
  projectId: string | null
  customerId: string | null
  templateId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface ProposalWithRelations extends Proposal {
  project: { id: string; name: string; number: string } | null
  customer: {
    id: string
    firstName: string
    lastName: string
    company: string | null
    email: string | null
    phone: string | null
  } | null
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  template: { id: string; name: string } | null
  lineItems: ProposalLineItem[]
}

export interface ProposalTemplate {
  id: string
  name: string
  description: string | null
  coverLetter: string | null
  terms: string | null
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProposalInput {
  title: string
  projectId?: string
  customerId?: string
  templateId?: string
  coverLetter?: string
  terms?: string
  validUntil?: string
  lineItems?: CreateProposalLineItemInput[]
}

export interface CreateProposalLineItemInput {
  description: string
  quantity: number
  unit?: string
  unitPrice: number
  notes?: string | null
  sortOrder?: number
}

export interface UpdateProposalInput {
  title?: string
  status?: ProposalStatus
  projectId?: string | null
  customerId?: string | null
  coverLetter?: string | null
  terms?: string | null
  validUntil?: string | null
  submittedAt?: string | null
}

export interface UpsertProposalLineItemsInput {
  lineItems: {
    description: string
    quantity: number
    unit?: string
    unitPrice: number
    notes?: string | null
    sortOrder?: number
  }[]
}

export interface CreateProposalTemplateInput {
  name: string
  description?: string
  coverLetter?: string
  terms?: string
}

export interface UpdateProposalTemplateInput {
  name?: string
  description?: string | null
  coverLetter?: string | null
  terms?: string | null
  isActive?: boolean
}
