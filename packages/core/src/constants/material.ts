import type { MaterialUnit } from '../types/material'

export const MATERIAL_UNITS: Record<MaterialUnit, { label: string; description: string }> = {
  EA: { label: 'EA', description: 'Each' },
  LF: { label: 'LF', description: 'Linear Foot' },
  SF: { label: 'SF', description: 'Square Foot' },
  SY: { label: 'SY', description: 'Square Yard' },
  CY: { label: 'CY', description: 'Cubic Yard' },
  LB: { label: 'LB', description: 'Pound' },
  TON: { label: 'TON', description: 'Ton' },
  GAL: { label: 'GAL', description: 'Gallon' },
  HR: { label: 'HR', description: 'Hour' },
  LS: { label: 'LS', description: 'Lump Sum' },
  BF: { label: 'BF', description: 'Board Foot' },
  MBF: { label: 'MBF', description: 'Thousand Board Feet' },
}

export const MATERIAL_UNIT_LIST = Object.entries(MATERIAL_UNITS).map(([value, meta]) => ({
  value: value as MaterialUnit,
  ...meta,
}))

export const MATERIAL_PRICE_HISTORY_MONTHS = 6
