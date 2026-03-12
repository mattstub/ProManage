export type ContactType =
  | 'CONTRACTOR'
  | 'CUSTOMER'
  | 'VENDOR'
  | 'SUBCONTRACTOR'
  | 'EMPLOYEE'
  | 'INSPECTOR'
  | 'ARCHITECT'
  | 'ENGINEER'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string | null
  type: ContactType
  email: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  notes: string | null
  isActive: boolean
  organizationId: string
  createdById: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface ContactProjectSummary {
  id: string
  name: string
  number: string
}

export interface ContactWithRelations extends Contact {
  createdBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  projectContacts: Array<{
    assignedAt: string | Date
    project: ContactProjectSummary
  }>
}

export interface CreateContactInput {
  firstName: string
  lastName: string
  company?: string | null
  type: ContactType
  email?: string | null
  phone?: string | null
  mobile?: string | null
  title?: string | null
  notes?: string | null
}

export interface UpdateContactInput {
  firstName?: string
  lastName?: string
  company?: string | null
  type?: ContactType
  email?: string | null
  phone?: string | null
  mobile?: string | null
  title?: string | null
  notes?: string | null
  isActive?: boolean
}
