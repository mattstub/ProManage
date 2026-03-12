import type { ContactType } from '../types/contact'

export const CONTACT_TYPES: Record<ContactType, { label: string; color: string }> = {
  CONTRACTOR: { label: 'Contractor', color: 'blue' },
  CUSTOMER: { label: 'Customer', color: 'green' },
  VENDOR: { label: 'Vendor', color: 'purple' },
  SUBCONTRACTOR: { label: 'Subcontractor', color: 'orange' },
  EMPLOYEE: { label: 'Employee', color: 'gray' },
  INSPECTOR: { label: 'Inspector', color: 'yellow' },
  ARCHITECT: { label: 'Architect', color: 'indigo' },
  ENGINEER: { label: 'Engineer', color: 'red' },
}

export const CONTACT_TYPE_LIST = [
  'CONTRACTOR',
  'CUSTOMER',
  'VENDOR',
  'SUBCONTRACTOR',
  'EMPLOYEE',
  'INSPECTOR',
  'ARCHITECT',
  'ENGINEER',
] as const satisfies readonly ContactType[]
