import type { EstimateStatus, EstimateUnit } from '../types/estimation'

export const ESTIMATE_STATUSES: Record<EstimateStatus, { label: string; description: string }> = {
  DRAFT: { label: 'Draft', description: 'Estimate is being prepared' },
  ACTIVE: { label: 'Active', description: 'Estimate submitted or under review' },
  AWARDED: { label: 'Awarded', description: 'Project was awarded to this organization' },
  LOST: { label: 'Lost', description: 'Bid was not awarded' },
}

export const ESTIMATE_STATUS_LIST = Object.entries(ESTIMATE_STATUSES).map(([value, meta]) => ({
  value: value as EstimateStatus,
  ...meta,
}))

export const ESTIMATE_UNITS: Record<EstimateUnit, { label: string; plural: string }> = {
  EA: { label: 'Each', plural: 'Each' },
  LF: { label: 'Linear Foot', plural: 'Linear Feet' },
  SF: { label: 'Square Foot', plural: 'Square Feet' },
  SY: { label: 'Square Yard', plural: 'Square Yards' },
  CY: { label: 'Cubic Yard', plural: 'Cubic Yards' },
  TON: { label: 'Ton', plural: 'Tons' },
  LS: { label: 'Lump Sum', plural: 'Lump Sum' },
  HR: { label: 'Hour', plural: 'Hours' },
  DAY: { label: 'Day', plural: 'Days' },
  MGAL: { label: 'Thousand Gallons', plural: 'Thousand Gallons' },
  GAL: { label: 'Gallon', plural: 'Gallons' },
}

export const ESTIMATE_UNIT_LIST = Object.entries(ESTIMATE_UNITS).map(([value, meta]) => ({
  value: value as EstimateUnit,
  ...meta,
}))
