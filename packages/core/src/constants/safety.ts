import type {
  SafetyDocumentCategory,
  ToolboxTalkStatus,
  SafetyFormCategory,
  IncidentType,
  IncidentStatus,
  JhaStatus,
  EmergencyContactRole,
} from '../types/safety'

export const SAFETY_DOCUMENT_CATEGORIES: Record<SafetyDocumentCategory, { label: string }> = {
  POLICY:        { label: 'Policy' },
  PROCEDURE:     { label: 'Procedure' },
  EMERGENCY_PLAN: { label: 'Emergency Plan' },
  TRAINING:      { label: 'Training' },
  COMPLIANCE:    { label: 'Compliance' },
  OTHER:         { label: 'Other' },
}

export const SAFETY_DOCUMENT_CATEGORY_LIST = Object.entries(SAFETY_DOCUMENT_CATEGORIES).map(
  ([value, meta]) => ({ value: value as SafetyDocumentCategory, ...meta })
)

export const TOOLBOX_TALK_STATUSES: Record<ToolboxTalkStatus, { label: string; color: string }> = {
  SCHEDULED:  { label: 'Scheduled',  color: 'blue'   },
  COMPLETED:  { label: 'Completed',  color: 'green'  },
  CANCELLED:  { label: 'Cancelled',  color: 'gray'   },
}

export const TOOLBOX_TALK_STATUS_LIST = Object.entries(TOOLBOX_TALK_STATUSES).map(
  ([value, meta]) => ({ value: value as ToolboxTalkStatus, ...meta })
)

export const SAFETY_FORM_CATEGORIES: Record<SafetyFormCategory, { label: string }> = {
  INSPECTION:        { label: 'Inspection' },
  JSA:               { label: 'Job Safety Analysis (JSA)' },
  HAZARD_ASSESSMENT: { label: 'Hazard Assessment' },
  PERMIT:            { label: 'Work Permit' },
  TAILGATE:          { label: 'Tailgate Meeting' },
  OTHER:             { label: 'Other' },
}

export const SAFETY_FORM_CATEGORY_LIST = Object.entries(SAFETY_FORM_CATEGORIES).map(
  ([value, meta]) => ({ value: value as SafetyFormCategory, ...meta })
)

export const INCIDENT_TYPES: Record<IncidentType, { label: string; color: string }> = {
  NEAR_MISS:       { label: 'Near Miss',        color: 'yellow'  },
  FIRST_AID:       { label: 'First Aid',         color: 'blue'    },
  RECORDABLE:      { label: 'Recordable',        color: 'orange'  },
  PROPERTY_DAMAGE: { label: 'Property Damage',   color: 'orange'  },
  FATALITY:        { label: 'Fatality',          color: 'red'     },
  ENVIRONMENTAL:   { label: 'Environmental',     color: 'purple'  },
}

export const INCIDENT_TYPE_LIST = Object.entries(INCIDENT_TYPES).map(
  ([value, meta]) => ({ value: value as IncidentType, ...meta })
)

export const INCIDENT_STATUSES: Record<IncidentStatus, { label: string; color: string }> = {
  OPEN:         { label: 'Open',          color: 'red'    },
  UNDER_REVIEW: { label: 'Under Review',  color: 'yellow' },
  CLOSED:       { label: 'Closed',        color: 'green'  },
}

export const INCIDENT_STATUS_LIST = Object.entries(INCIDENT_STATUSES).map(
  ([value, meta]) => ({ value: value as IncidentStatus, ...meta })
)

// ─── Phase 4.3 — Job-Specific Safety ─────────────────────────────────────────

export const JHA_STATUSES: Record<JhaStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Draft',    color: 'gray'   },
  ACTIVE:   { label: 'Active',   color: 'green'  },
  ARCHIVED: { label: 'Archived', color: 'gray'   },
}

export const JHA_STATUS_LIST = Object.entries(JHA_STATUSES).map(
  ([value, meta]) => ({ value: value as JhaStatus, ...meta })
)

export const EMERGENCY_CONTACT_ROLES: Record<EmergencyContactRole, { label: string }> = {
  SITE_SUPERVISOR: { label: 'Site Supervisor' },
  HOSPITAL:        { label: 'Hospital'        },
  FIRE:            { label: 'Fire Department' },
  POLICE:          { label: 'Police'          },
  UTILITY:         { label: 'Utility'         },
  OTHER:           { label: 'Other'           },
}

export const EMERGENCY_CONTACT_ROLE_LIST = Object.entries(EMERGENCY_CONTACT_ROLES).map(
  ([value, meta]) => ({ value: value as EmergencyContactRole, ...meta })
)

export const ALLOWED_JHA_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const MAX_JHA_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB
