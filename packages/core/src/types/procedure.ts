export type ProcedureStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type ProcedureCategory =
  | 'General'
  | 'Safety'
  | 'Quality'
  | 'HR'
  | 'Finance'
  | 'Operations'

export interface Procedure {
  id: string
  title: string
  content: string
  category: string
  status: ProcedureStatus
  organizationId: string
  projectId?: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface ProcedureWithRelations extends Procedure {
  project?: {
    id: string
    name: string
    number: string
  } | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateProcedureInput {
  title: string
  content: string
  category?: string
  projectId?: string
}

export interface UpdateProcedureInput {
  title?: string
  content?: string
  category?: string
  status?: ProcedureStatus
  projectId?: string | null
}
