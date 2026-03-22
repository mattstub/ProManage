'use client'

import {
  ExclamationTriangleIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { use, useState } from 'react'

import {
  EMERGENCY_CONTACT_ROLE_LIST,
  EMERGENCY_CONTACT_ROLES,
  INCIDENT_TYPE_LIST,
  JHA_STATUSES,
  TOOLBOX_TALK_STATUSES,
} from '@promanage/core'
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@promanage/ui-components'

import type {
  EmergencyContactRole,
  JhaStatus,
  JobHazardAnalysis,
  ProjectEmergencyContact,
  ProjectSdsEntry,
} from '@promanage/core'


import { useAuth } from '@/hooks/use-auth'
import {
  useAddProjectSdsEntry,
  useCreateEmergencyContact,
  useCreateJha,
  useDeleteEmergencyContact,
  useDeleteJha,
  useEmergencyContacts,
  useJhas,
  useProjectIncidents,
  useProjectSafetyDocuments,
  useProjectSdsEntries,
  useProjectToolboxTalks,
  useRemoveProjectSdsEntry,
  useUpdateJha,
} from '@/hooks/use-job-safety'
import { useSdsEntries } from '@/hooks/use-safety'

// ─── Emergency Contacts Section ───────────────────────────────────────────────

function EmergencyContactsSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const isManager = user?.roles?.some((r) =>
    ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin'].includes(r)
  )

  const { data: contacts, isLoading } = useEmergencyContacts(projectId)
  const create = useCreateEmergencyContact(projectId)
  const remove = useDeleteEmergencyContact(projectId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{
    name: string
    role: EmergencyContactRole
    phone: string
    address: string
    notes: string
  }>({ name: '', role: 'OTHER', phone: '', address: '', notes: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(
      { name: form.name, role: form.role, phone: form.phone, address: form.address || undefined, notes: form.notes || undefined },
      { onSuccess: () => { setOpen(false); setForm({ name: '', role: 'OTHER', phone: '', address: '', notes: '' }) } }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <PhoneIcon className="h-4 w-4" /> Emergency Contacts
        </h3>
        {isManager && (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add Contact
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !contacts?.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No emergency contacts added yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((c: ProjectEmergencyContact) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-3 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{EMERGENCY_CONTACT_ROLES[c.role as EmergencyContactRole]?.label ?? c.role}</p>
                  <p className="text-sm text-blue-600 mt-1">{c.phone}</p>
                  {c.address && <p className="text-xs text-gray-400 mt-0.5">{c.address}</p>}
                </div>
                {isManager && (
                  <button
                    onClick={() => remove.mutate(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Remove"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {c.notes && <p className="text-xs text-gray-500 mt-1 italic">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ec-name">Name *</Label>
              <Input id="ec-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="ec-role">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as EmergencyContactRole })}>
                <SelectTrigger id="ec-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMERGENCY_CONTACT_ROLE_LIST.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ec-phone">Phone *</Label>
              <Input id="ec-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="ec-address">Address</Label>
              <Input id="ec-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ec-notes">Notes</Label>
              <Textarea id="ec-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Adding…' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── JHA Section ──────────────────────────────────────────────────────────────

function JhaSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const isManager = user?.roles?.some((r) =>
    ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin'].includes(r)
  )

  const { data, isLoading } = useJhas(projectId)
  const create = useCreateJha(projectId)
  const update = useUpdateJha(projectId)
  const remove = useDeleteJha(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    create.mutate(
      { title: form.title, description: form.description || undefined },
      { onSuccess: () => { setCreateOpen(false); setForm({ title: '', description: '' }) } }
    )
  }

  const jhas: JobHazardAnalysis[] = data?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4" /> Job Hazard Analyses (JHAs)
        </h3>
        {isManager && (
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" /> New JHA
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !jhas.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No JHAs added yet.</p>
      ) : (
        <div className="space-y-2">
          {jhas.map((jha) => {
            const statusMeta = JHA_STATUSES[jha.status as JhaStatus]
            return (
              <div key={jha.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{jha.title}</p>
                    {jha.description && (
                      <p className="text-xs text-gray-500 truncate">{jha.description}</p>
                    )}
                  </div>
                  <Badge variant={statusMeta?.color === 'green' ? 'success' : 'outline'}>
                    {statusMeta?.label ?? jha.status}
                  </Badge>
                </div>
                {isManager && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    {jha.status !== 'ACTIVE' && (
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: jha.id, input: { status: 'ACTIVE' } })}>
                        Activate
                      </Button>
                    )}
                    {jha.status !== 'ARCHIVED' && (
                      <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: jha.id, input: { status: 'ARCHIVED' } })}>
                        Archive
                      </Button>
                    )}
                    <button onClick={() => remove.mutate(jha.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Job Hazard Analysis</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="jha-title">Title *</Label>
              <Input id="jha-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Excavation JHA" required />
            </div>
            <div>
              <Label htmlFor="jha-desc">Description / Hazard Notes</Label>
              <Textarea
                id="jha-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the work scope, identified hazards, and controls…"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create JHA'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── SDS Binder Section ───────────────────────────────────────────────────────

function SdsBinderSection({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const isManager = user?.roles?.some((r) =>
    ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin'].includes(r)
  )

  const { data, isLoading } = useProjectSdsEntries(projectId)
  const { data: orgSds } = useSdsEntries()
  const add = useAddProjectSdsEntry(projectId)
  const remove = useRemoveProjectSdsEntry(projectId)

  const [open, setOpen] = useState(false)
  const [selectedSdsId, setSelectedSdsId] = useState('')

  const entries: ProjectSdsEntry[] = data?.data ?? []
  const existingIds = new Set(entries.map((e) => e.sdsEntryId))
  const availableOrgSds = (orgSds?.data ?? []).filter((s: { id: string }) => !existingIds.has(s.id))

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSdsId) return
    add.mutate(
      { sdsEntryId: selectedSdsId },
      { onSuccess: () => { setOpen(false); setSelectedSdsId('') } }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          SDS Binder
        </h3>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              Print Binder
            </Button>
          )}
          {isManager && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" /> Add SDS
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !entries.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No SDS entries in this project binder.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 group">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{entry.sdsEntry.productName}</p>
                <p className="text-xs text-gray-500">
                  {[entry.sdsEntry.manufacturer, entry.sdsEntry.chemicalName].filter(Boolean).join(' · ')}
                </p>
              </div>
              {isManager && (
                <button
                  onClick={() => remove.mutate(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity ml-2 shrink-0"
                  title="Remove from binder"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add SDS to Project Binder</DialogTitle>
          </DialogHeader>
          {!availableOrgSds.length ? (
            <p className="text-sm text-gray-500 py-4">All org SDS entries are already in this binder, or none exist yet.</p>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label htmlFor="sds-pick">Select SDS Entry</Label>
                <Select value={selectedSdsId} onValueChange={setSelectedSdsId}>
                  <SelectTrigger id="sds-pick">
                    <SelectValue placeholder="Choose from org catalog…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgSds.map((s: { id: string; productName: string; manufacturer?: string | null }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.productName}{s.manufacturer ? ` — ${s.manufacturer}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={!selectedSdsId || add.isPending}>
                  {add.isPending ? 'Adding…' : 'Add to Binder'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Safety Documents (read-only project view) ────────────────────────────────

function SafetyDocumentsSection({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectSafetyDocuments(projectId)
  const docs = data?.data ?? []

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
        Safety Documents
      </h3>
      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !docs.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No safety documents linked to this project.</p>
      ) : (
        <div className="space-y-1">
          {docs.map((doc: { id: string; title: string; category: string; fileName: string }) => (
            <div key={doc.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5">
              <Badge variant="outline">{doc.category}</Badge>
              <p className="text-sm text-gray-900 truncate">{doc.title}</p>
              <p className="text-xs text-gray-400 ml-auto truncate">{doc.fileName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toolbox Talks (read-only project view) ────────────────────────────────────

function ToolboxTalksSection({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectToolboxTalks(projectId)
  const talks = data?.data ?? []

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
        Toolbox Talks
      </h3>
      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !talks.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No toolbox talks associated with this project.</p>
      ) : (
        <div className="space-y-1">
          {talks.map((t: { id: string; title: string; status: string; conductedDate: string | null; scheduledDate: string | null }) => {
            const statusMeta = TOOLBOX_TALK_STATUSES[t.status as keyof typeof TOOLBOX_TALK_STATUSES]
            const date = t.conductedDate ?? t.scheduledDate
            return (
              <div key={t.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5">
                <Badge variant={statusMeta?.color === 'green' ? 'success' : 'outline'}>
                  {statusMeta?.label ?? t.status}
                </Badge>
                <p className="text-sm text-gray-900 truncate">{t.title}</p>
                {date && <p className="text-xs text-gray-400 ml-auto">{new Date(date).toLocaleDateString()}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Incidents (read-only project view) ───────────────────────────────────────

function IncidentsSection({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectIncidents(projectId)
  const reports = data?.data ?? []

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" /> Incidents
      </h3>
      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : !reports.length ? (
        <p className="text-sm text-gray-400 py-4 text-center">No incidents reported on this project.</p>
      ) : (
        <div className="space-y-1">
          {reports.map((r: {
            id: string
            title: string
            incidentType: string
            status: string
            incidentDate: string
          }) => {
            const typeMeta = INCIDENT_TYPE_LIST.find((t) => t.value === r.incidentType)
            return (
              <div key={r.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5">
                <Badge variant="warning">{typeMeta?.label ?? r.incidentType}</Badge>
                <p className="text-sm text-gray-900 truncate">{r.title}</p>
                <p className="text-xs text-gray-400 ml-auto">{new Date(r.incidentDate).toLocaleDateString()}</p>
                <Badge variant={r.status === 'CLOSED' ? 'success' : 'outline'}>{r.status}</Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectSafetyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)

  return (
    <div className="space-y-8">
      <Tabs defaultValue="emergency-contacts">
        <TabsList>
          <TabsTrigger value="emergency-contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="jhas">JHAs</TabsTrigger>
          <TabsTrigger value="sds">SDS Binder</TabsTrigger>
          <TabsTrigger value="safety-docs">Safety Documents</TabsTrigger>
          <TabsTrigger value="toolbox">Toolbox Talks</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="emergency-contacts" className="mt-6">
          <EmergencyContactsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="jhas" className="mt-6">
          <JhaSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="sds" className="mt-6">
          <SdsBinderSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="safety-docs" className="mt-6">
          <SafetyDocumentsSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="toolbox" className="mt-6">
          <ToolboxTalksSection projectId={projectId} />
        </TabsContent>

        <TabsContent value="incidents" className="mt-6">
          <IncidentsSection projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
