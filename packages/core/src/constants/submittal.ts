import type { SubmittalStatus, SubmittalType } from '../types/submittal'

export const SUBMITTAL_TYPE_LIST: { value: SubmittalType; label: string }[] = [
  { value: 'SHOP_DRAWINGS', label: 'Shop Drawings' },
  { value: 'PRODUCT_DATA', label: 'Product Data' },
  { value: 'SAMPLES', label: 'Samples' },
  { value: 'MOCKUPS', label: 'Mockups' },
  { value: 'CALCULATIONS', label: 'Calculations' },
  { value: 'VENDOR_INFO', label: 'Vendor Information' },
  { value: 'WARRANTIES', label: 'Warranties' },
  { value: 'MANUALS', label: 'Manuals' },
  { value: 'AS_BUILTS', label: 'As-Builts' },
]

export const SUBMITTAL_TYPES: Record<SubmittalType, string> = {
  SHOP_DRAWINGS: 'Shop Drawings',
  PRODUCT_DATA: 'Product Data',
  SAMPLES: 'Samples',
  MOCKUPS: 'Mockups',
  CALCULATIONS: 'Calculations',
  VENDOR_INFO: 'Vendor Information',
  WARRANTIES: 'Warranties',
  MANUALS: 'Manuals',
  AS_BUILTS: 'As-Builts',
}

export const SUBMITTAL_STATUS_LIST: { value: SubmittalStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'APPROVED_AS_NOTED', label: 'Approved as Noted' },
  { value: 'REVISE_RESUBMIT', label: 'Revise & Resubmit' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'VOID', label: 'Void' },
]

export const SUBMITTAL_STATUSES: Record<SubmittalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  APPROVED_AS_NOTED: 'Approved as Noted',
  REVISE_RESUBMIT: 'Revise & Resubmit',
  REJECTED: 'Rejected',
  VOID: 'Void',
}

export const BALL_IN_COURT_OPTIONS = [
  'Architect',
  'Engineer',
  'Owner',
  'GC',
  'Subcontractor',
  'Supplier',
] as const
