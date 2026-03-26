export type SubmittalType =
  | 'SHOP_DRAWINGS'
  | 'PRODUCT_DATA'
  | 'SAMPLES'
  | 'MOCKUPS'
  | 'CALCULATIONS'
  | 'VENDOR_INFO'
  | 'WARRANTIES'
  | 'MANUALS'
  | 'AS_BUILTS'

export type SubmittalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE_RESUBMIT'
  | 'REJECTED'
  | 'VOID'

export interface Submittal {
  id: string
  submittalNumber: string
  specSection: string | null
  title: string
  description: string | null
  type: SubmittalType
  status: SubmittalStatus
  revision: number
  submittedDate: string | null
  requiredByDate: string | null
  returnedDate: string | null
  ballInCourt: string | null
  approver: string | null
  notes: string | null
  organizationId: string
  projectId: string
  createdById: string
  createdAt: string
  updatedAt: string
  project?: { id: string; name: string; number: string }
  createdBy?: { id: string; firstName: string; lastName: string; email: string }
  documents?: SubmittalDocument[]
}

export interface SubmittalDocument {
  id: string
  name: string
  fileKey: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  notes: string | null
  submittalId: string
  uploadedById: string | null
  createdAt: string
  updatedAt: string
  uploadedBy?: { id: string; firstName: string; lastName: string } | null
}

export interface CreateSubmittalInput {
  projectId: string
  submittalNumber: string
  specSection?: string
  title: string
  description?: string
  type: SubmittalType
  revision?: number
  submittedDate?: string
  requiredByDate?: string
  returnedDate?: string
  ballInCourt?: string
  approver?: string
  notes?: string
}

export interface UpdateSubmittalInput {
  submittalNumber?: string
  specSection?: string
  title?: string
  description?: string
  type?: SubmittalType
  status?: SubmittalStatus
  revision?: number
  submittedDate?: string
  requiredByDate?: string
  returnedDate?: string
  ballInCourt?: string
  approver?: string
  notes?: string
}

export interface CreateSubmittalDocumentInput {
  name: string
  notes?: string
}

export interface UpdateSubmittalDocumentInput {
  name?: string
  notes?: string
}
