import type { DrawingPhase } from '../types/construction-documents'

export const DRAWING_PHASES: Record<DrawingPhase, { label: string; description: string }> = {
  DESIGN_DEVELOPMENT: {
    label: 'Design Development',
    description: 'Documents issued during the design development phase',
  },
  BIDDING_DOCUMENTS: {
    label: 'Bidding Documents',
    description: 'Documents issued for bidding and procurement',
  },
  CONSTRUCTION_DOCUMENTS: {
    label: 'Construction Documents',
    description: 'Final documents issued for construction',
  },
}

export const DRAWING_PHASES_LIST = Object.entries(DRAWING_PHASES).map(([value, meta]) => ({
  value: value as DrawingPhase,
  ...meta,
}))

export const ALLOWED_DRAWING_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
] as const

export const MAX_DRAWING_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB
