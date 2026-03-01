export const RESOURCES = [
  'organization',
  'user',
  'project',
  'contact',
  'document',
  'timeEntry',
  'dailyReport',
  'contract',
  'changeOrder',
  'submittal',
  'rfi',
  'purchaseOrder',
  'payApplication',
  'equipment',
  'safety',
  'schedule',
] as const

export const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
] as const

export type Resource = (typeof RESOURCES)[number]
export type Action = (typeof ACTIONS)[number]

export interface PermissionDefinition {
  resource: Resource
  action: Action
}

/**
 * Default permissions for each system role.
 * Maps role names to the resources and actions they can perform.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionDefinition[]> = {
  Admin: RESOURCES.flatMap((resource) =>
    ACTIONS.map((action) => ({ resource, action }))
  ),
  ProjectManager: [
    { resource: 'project', action: 'create' },
    { resource: 'project', action: 'read' },
    { resource: 'project', action: 'update' },
    { resource: 'user', action: 'read' },
    { resource: 'contact', action: 'create' },
    { resource: 'contact', action: 'read' },
    { resource: 'contact', action: 'update' },
    { resource: 'document', action: 'create' },
    { resource: 'document', action: 'read' },
    { resource: 'document', action: 'update' },
    { resource: 'timeEntry', action: 'read' },
    { resource: 'timeEntry', action: 'update' },
    { resource: 'dailyReport', action: 'read' },
    { resource: 'contract', action: 'create' },
    { resource: 'contract', action: 'read' },
    { resource: 'contract', action: 'update' },
    { resource: 'changeOrder', action: 'create' },
    { resource: 'changeOrder', action: 'read' },
    { resource: 'changeOrder', action: 'update' },
    { resource: 'submittal', action: 'create' },
    { resource: 'submittal', action: 'read' },
    { resource: 'submittal', action: 'update' },
    { resource: 'rfi', action: 'create' },
    { resource: 'rfi', action: 'read' },
    { resource: 'rfi', action: 'update' },
    { resource: 'purchaseOrder', action: 'create' },
    { resource: 'purchaseOrder', action: 'read' },
    { resource: 'purchaseOrder', action: 'update' },
    { resource: 'payApplication', action: 'create' },
    { resource: 'payApplication', action: 'read' },
    { resource: 'payApplication', action: 'update' },
    { resource: 'equipment', action: 'read' },
    { resource: 'safety', action: 'read' },
    { resource: 'schedule', action: 'create' },
    { resource: 'schedule', action: 'read' },
    { resource: 'schedule', action: 'update' },
  ],
  Superintendent: [
    { resource: 'project', action: 'read' },
    { resource: 'user', action: 'read' },
    { resource: 'contact', action: 'read' },
    { resource: 'document', action: 'read' },
    { resource: 'timeEntry', action: 'create' },
    { resource: 'timeEntry', action: 'read' },
    { resource: 'timeEntry', action: 'update' },
    { resource: 'dailyReport', action: 'create' },
    { resource: 'dailyReport', action: 'read' },
    { resource: 'dailyReport', action: 'update' },
    { resource: 'safety', action: 'read' },
    { resource: 'schedule', action: 'read' },
    { resource: 'equipment', action: 'read' },
  ],
  Foreman: [
    { resource: 'project', action: 'read' },
    { resource: 'contact', action: 'read' },
    { resource: 'document', action: 'read' },
    { resource: 'timeEntry', action: 'create' },
    { resource: 'timeEntry', action: 'read' },
    { resource: 'dailyReport', action: 'create' },
    { resource: 'dailyReport', action: 'read' },
    { resource: 'safety', action: 'read' },
    { resource: 'schedule', action: 'read' },
  ],
  FieldUser: [
    { resource: 'project', action: 'read' },
    { resource: 'timeEntry', action: 'create' },
    { resource: 'timeEntry', action: 'read' },
    { resource: 'dailyReport', action: 'read' },
    { resource: 'safety', action: 'read' },
  ],
  OfficeAdmin: [
    { resource: 'organization', action: 'read' },
    { resource: 'organization', action: 'update' },
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'project', action: 'read' },
    { resource: 'contact', action: 'create' },
    { resource: 'contact', action: 'read' },
    { resource: 'contact', action: 'update' },
    { resource: 'contact', action: 'delete' },
    { resource: 'document', action: 'create' },
    { resource: 'document', action: 'read' },
    { resource: 'document', action: 'update' },
    { resource: 'timeEntry', action: 'read' },
    { resource: 'safety', action: 'create' },
    { resource: 'safety', action: 'read' },
    { resource: 'safety', action: 'update' },
  ],
}
