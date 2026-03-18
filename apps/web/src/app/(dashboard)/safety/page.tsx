'use client'

import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'

import {
  INCIDENT_STATUSES,
  INCIDENT_TYPE_LIST,
  INCIDENT_STATUS_LIST,
  SAFETY_DOCUMENT_CATEGORY_LIST,
  SAFETY_FORM_CATEGORY_LIST,
  TOOLBOX_TALK_STATUS_LIST,
  type IncidentStatus,
  type IncidentType,
  type RoleName,
  type SafetyDocumentCategory,
  type SafetyFormCategory,
  type ToolboxTalkStatus,
} from '@promanage/core'
import {
  Badge,
  Breadcrumbs,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  type BadgeProps,
} from '@promanage/ui-components'

import type {
  SafetyDocument,
  SdsEntry,
  ToolboxTalk,
  SafetyForm,
  IncidentReport,
} from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import { useProjects } from '@/hooks/use-projects'
import {
  useAddTalkAttendee,
  useCreateIncidentReport,
  useCreateSafetyForm,
  useCreateToolboxTalk,
  useDeleteIncidentReport,
  useDeleteSafetyDocument,
  useDeleteSafetyForm,
  useDeleteSdsEntry,
  useDeleteToolboxTalk,
  useDownloadSafetyDocument,
  useDownloadSds,
  useIncidentReports,
  useRemoveTalkAttendee,
  useSafetyDocuments,
  useSafetyForms,
  useSdsEntries,
  useToolboxTalk,
  useToolboxTalks,
  useUpdateIncidentReport,
  useUpdateSafetyDocument,
  useUpdateSafetyForm,
  useUpdateSdsEntry,
  useUpdateToolboxTalk,
  useUploadSafetyDocument,
  useUploadSds,
} from '@/hooks/use-safety'

// ─── Constants ───────────────────────────────────────────────────────────────

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin']
const MANAGE_ROLES: RoleName[] = ['Admin', 'OfficeAdmin']
const INCIDENT_VIEW_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'Superintendent', 'OfficeAdmin']

const INCIDENT_STATUS_VARIANT: Record<IncidentStatus, BadgeProps['variant']> = {
  OPEN: 'danger',
  UNDER_REVIEW: 'warning',
  CLOSED: 'success',
}

const TALK_STATUS_VARIANT: Record<ToolboxTalkStatus, BadgeProps['variant']> = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'default',
}

type Tab = 'documents' | 'sds' | 'toolbox-talks' | 'forms' | 'incidents'

// ─── Shared Skeletons ──────────────────────────────────────────────────────────

function RowSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(cols)].map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ─── Safety Documents Tab ──────────────────────────────────────────────────────

interface DocFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: SafetyDocument | null
}

function DocFormDialog({ open, onOpenChange, initial }: DocFormDialogProps) {
  const uploadDoc = useUploadSafetyDocument()
  const updateDoc = useUpdateSafetyDocument()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SafetyDocumentCategory>('OTHER')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setDescription(initial.description ?? '')
      setCategory(initial.category as SafetyDocumentCategory)
    } else {
      setTitle(''); setDescription(''); setCategory('OTHER'); setFile(null)
    }
  }, [initial, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      await updateDoc.mutateAsync({ id: initial.id, title, description: description || undefined, category })
    } else {
      if (!file) return
      await uploadDoc.mutateAsync({ file, meta: { title, description: description || undefined, category } })
    }
    onOpenChange(false)
  }

  const isPending = uploadDoc.isPending || updateDoc.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Document' : 'Upload Safety Document'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="doc-title">Title *</Label>
            <Input id="doc-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as SafetyDocumentCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SAFETY_DOCUMENT_CATEGORY_LIST.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="doc-desc">Description</Label>
            <Textarea id="doc-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          {!initial && (
            <div className="space-y-1">
              <Label>File *</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                  {file ? file.name : 'Choose file'}
                </Button>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || (!initial && !file)}>
              {isPending ? 'Saving…' : (initial ? 'Save' : 'Upload')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentsTab({ canWrite, canManage }: { canWrite: boolean; canManage: boolean }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SafetyDocumentCategory | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SafetyDocument | null>(null)

  const { data, isLoading } = useSafetyDocuments({
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
  })
  const downloadDoc = useDownloadSafetyDocument()
  const deleteDoc = useDeleteSafetyDocument()

  const docs = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as SafetyDocumentCategory | 'ALL')}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {SAFETY_DOCUMENT_CATEGORY_LIST.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <PlusIcon className="h-4 w-4 mr-1" /> Upload
          </Button>
        )}
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RowSkeleton cols={5} />
            ) : docs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No documents found. {canWrite && 'Upload your first safety document.'}
                </TableCell>
              </TableRow>
            ) : (
              docs.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div>{doc.title}</div>
                    {doc.description && <div className="text-xs text-gray-500 truncate max-w-xs">{doc.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="default">{doc.category}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-600 truncate max-w-[160px]">{doc.fileName}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => downloadDoc.mutate(doc.id)} title="Download">
                        <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(doc); setFormOpen(true) }}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => deleteDoc.mutate(doc.id)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DocFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editTarget} />
    </div>
  )
}

// ─── SDS Catalog Tab ──────────────────────────────────────────────────────────

interface SdsFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: SdsEntry | null
}

function SdsFormDialog({ open, onOpenChange, initial }: SdsFormDialogProps) {
  const uploadSds = useUploadSds()
  const updateSds = useUpdateSdsEntry()
  const fileRef = useRef<HTMLInputElement>(null)

  const [productName, setProductName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [chemicalName, setChemicalName] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (initial) {
      setProductName(initial.productName)
      setManufacturer(initial.manufacturer ?? '')
      setChemicalName(initial.chemicalName ?? '')
      setReviewDate(initial.reviewDate ? initial.reviewDate.slice(0, 10) : '')
      setNotes(initial.notes ?? '')
    } else {
      setProductName(''); setManufacturer(''); setChemicalName('');
      setReviewDate(''); setNotes(''); setFile(null)
    }
  }, [initial, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const toIso = (d: string) => d ? new Date(d).toISOString() : undefined
    if (initial) {
      await updateSds.mutateAsync({
        id: initial.id,
        productName,
        manufacturer: manufacturer || null,
        chemicalName: chemicalName || null,
        reviewDate: toIso(reviewDate) ?? null,
        notes: notes || null,
      })
    } else {
      await uploadSds.mutateAsync({
        file: file ?? undefined,
        meta: {
          productName,
          manufacturer: manufacturer || undefined,
          chemicalName: chemicalName || undefined,
          reviewDate: toIso(reviewDate),
          notes: notes || undefined,
        },
      })
    }
    onOpenChange(false)
  }

  const isPending = uploadSds.isPending || updateSds.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit SDS Entry' : 'Add SDS Entry'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="sds-product">Product Name *</Label>
            <Input id="sds-product" value={productName} onChange={e => setProductName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="sds-mfr">Manufacturer</Label>
              <Input id="sds-mfr" value={manufacturer} onChange={e => setManufacturer(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sds-chem">Chemical Name</Label>
              <Input id="sds-chem" value={chemicalName} onChange={e => setChemicalName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sds-review">Review Date</Label>
            <Input id="sds-review" type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sds-notes">Notes</Label>
            <Textarea id="sds-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          {!initial && (
            <div className="space-y-1">
              <Label>SDS File (optional)</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                  {file ? file.name : 'Choose PDF'}
                </Button>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : (initial ? 'Save' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SdsTab({ canWrite, canManage }: { canWrite: boolean; canManage: boolean }) {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SdsEntry | null>(null)

  const { data, isLoading } = useSdsEntries({ search: search || undefined })
  const downloadSds = useDownloadSds()
  const deleteSds = useDeleteSdsEntry()

  const entries = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
        {canWrite && (
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add SDS
          </Button>
        )}
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Chemical Name</TableHead>
              <TableHead>Review Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RowSkeleton cols={5} />
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No SDS entries found. {canWrite && 'Add your first SDS entry.'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.productName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.manufacturer ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.chemicalName ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {entry.reviewDate ? new Date(entry.reviewDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {entry.sdsFileKey && (
                        <Button variant="ghost" size="sm" onClick={() => downloadSds.mutate(entry.id)} title="Download SDS">
                          <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(entry); setFormOpen(true) }}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => deleteSds.mutate(entry.id)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <SdsFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editTarget} />
    </div>
  )
}

// ─── Toolbox Talks Tab ────────────────────────────────────────────────────────

interface TalkFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: ToolboxTalk | null
  projects: { id: string; name: string }[]
}

function TalkFormDialog({ open, onOpenChange, initial, projects }: TalkFormDialogProps) {
  const createTalk = useCreateToolboxTalk()
  const updateTalk = useUpdateToolboxTalk()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState<ToolboxTalkStatus>('SCHEDULED')
  const [conductedDate, setConductedDate] = useState('')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setContent(initial.content ?? '')
      setScheduledDate(initial.scheduledDate ? initial.scheduledDate.slice(0, 10) : '')
      setProjectId(initial.projectId ?? '')
      setStatus(initial.status as ToolboxTalkStatus)
      setConductedDate(initial.conductedDate ? initial.conductedDate.slice(0, 10) : '')
    } else {
      setTitle(''); setContent(''); setScheduledDate(''); setProjectId(''); setStatus('SCHEDULED'); setConductedDate('')
    }
  }, [initial, open])

  const toIso = (d: string) => d ? new Date(d).toISOString() : undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      await updateTalk.mutateAsync({
        id: initial.id,
        title,
        content: content || null,
        scheduledDate: toIso(scheduledDate) ?? null,
        conductedDate: toIso(conductedDate) ?? null,
        status,
        projectId: projectId || null,
      })
    } else {
      await createTalk.mutateAsync({
        title,
        content: content || undefined,
        scheduledDate: toIso(scheduledDate),
        projectId: projectId || undefined,
      })
    }
    onOpenChange(false)
  }

  const isPending = createTalk.isPending || updateTalk.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Toolbox Talk' : 'New Toolbox Talk'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="talk-title">Title *</Label>
            <Input id="talk-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="talk-sched">Scheduled Date</Label>
              <Input id="talk-sched" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            {initial && (
              <div className="space-y-1">
                <Label htmlFor="talk-conducted">Conducted Date</Label>
                <Input id="talk-conducted" type="date" value={conductedDate} onChange={e => setConductedDate(e.target.value)} />
              </div>
            )}
          </div>
          {initial && (
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as ToolboxTalkStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOOLBOX_TALK_STATUS_LIST.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No project</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="talk-content">Content / Notes</Label>
            <Textarea id="talk-content" value={content} onChange={e => setContent(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : (initial ? 'Save' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TalkDetailDialog({
  talkId,
  open,
  onOpenChange,
  canWrite,
}: {
  talkId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  canWrite: boolean
}) {
  const { data: talk, isLoading } = useToolboxTalk(talkId)
  const addAttendee = useAddTalkAttendee()
  const removeAttendee = useRemoveTalkAttendee()

  const [attendeeName, setAttendeeName] = useState('')

  async function handleAddAttendee(e: React.FormEvent) {
    e.preventDefault()
    if (!attendeeName.trim()) return
    await addAttendee.mutateAsync({ talkId, name: attendeeName.trim() })
    setAttendeeName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{talk?.title ?? 'Toolbox Talk'}</DialogTitle>
        </DialogHeader>
        {isLoading || !talk ? (
          <div className="space-y-2 py-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
        ) : (
          <div className="space-y-4 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="font-medium text-gray-500">Status:</span>{' '}
                <Badge variant={TALK_STATUS_VARIANT[talk.status as ToolboxTalkStatus]}>{talk.status}</Badge>
              </div>
              <div><span className="font-medium text-gray-500">Scheduled:</span>{' '}
                {talk.scheduledDate ? new Date(talk.scheduledDate).toLocaleDateString() : '—'}
              </div>
              {talk.conductedDate && (
                <div><span className="font-medium text-gray-500">Conducted:</span>{' '}
                  {new Date(talk.conductedDate).toLocaleDateString()}
                </div>
              )}
              {talk.project && (
                <div><span className="font-medium text-gray-500">Project:</span> {talk.project.name}</div>
              )}
            </div>
            {talk.content && (
              <div>
                <p className="font-medium text-gray-500 mb-1">Content</p>
                <p className="text-gray-700 whitespace-pre-wrap">{talk.content}</p>
              </div>
            )}
            <hr />
            <div>
              <p className="font-medium text-gray-700 mb-2">Attendees ({talk.attendees.length})</p>
              {talk.attendees.length > 0 && (
                <ul className="space-y-1 mb-3">
                  {talk.attendees.map(a => (
                    <li key={a.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                      <span>{a.name}</span>
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => removeAttendee.mutate({ talkId: talk.id, attendeeId: a.id })}>
                          <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canWrite && (
                <form onSubmit={handleAddAttendee} className="flex gap-2">
                  <Input
                    placeholder="Attendee name"
                    value={attendeeName}
                    onChange={e => setAttendeeName(e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={addAttendee.isPending || !attendeeName.trim()}>
                    Add
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ToolboxTalksTab({
  canWrite,
  canManage,
  projects,
}: {
  canWrite: boolean
  canManage: boolean
  projects: { id: string; name: string }[]
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ToolboxTalkStatus | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ToolboxTalk | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useToolboxTalks({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  })
  const deleteTalk = useDeleteToolboxTalk()

  const talks = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search talks…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as ToolboxTalkStatus | 'ALL')}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {TOOLBOX_TALK_STATUS_LIST.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <PlusIcon className="h-4 w-4 mr-1" /> New Talk
          </Button>
        )}
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RowSkeleton cols={6} />
            ) : talks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No toolbox talks found. {canWrite && 'Schedule your first talk.'}
                </TableCell>
              </TableRow>
            ) : (
              talks.map(talk => (
                <TableRow key={talk.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setDetailId(talk.id)}>
                  <TableCell className="font-medium">{talk.title}</TableCell>
                  <TableCell>
                    <Badge variant={TALK_STATUS_VARIANT[talk.status as ToolboxTalkStatus]}>{talk.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {talk.scheduledDate ? new Date(talk.scheduledDate).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{talk.project?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{talk.attendees.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(talk); setFormOpen(true) }}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => deleteTalk.mutate(talk.id)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <TalkFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editTarget} projects={projects} />
      {detailId && (
        <TalkDetailDialog
          talkId={detailId}
          open={Boolean(detailId)}
          onOpenChange={open => { if (!open) setDetailId(null) }}
          canWrite={canWrite}
        />
      )}
    </div>
  )
}

// ─── Safety Forms Tab ──────────────────────────────────────────────────────────

interface FormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: SafetyForm | null
}

function SafetyFormDialog({ open, onOpenChange, initial }: FormDialogProps) {
  const createForm = useCreateSafetyForm()
  const updateForm = useUpdateSafetyForm()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SafetyFormCategory>('OTHER')
  const [content, setContent] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setDescription(initial.description ?? '')
      setCategory(initial.category as SafetyFormCategory)
      setContent(initial.content)
      setIsActive(initial.isActive)
    } else {
      setTitle(''); setDescription(''); setCategory('OTHER'); setContent(''); setIsActive(true)
    }
  }, [initial, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      await updateForm.mutateAsync({ id: initial.id, title, description: description || null, category, content, isActive })
    } else {
      await createForm.mutateAsync({ title, description: description || undefined, category, content: content || undefined })
    }
    onOpenChange(false)
  }

  const isPending = createForm.isPending || updateForm.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Safety Form' : 'New Safety Form'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="sf-title">Title *</Label>
            <Input id="sf-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as SafetyFormCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SAFETY_FORM_CATEGORY_LIST.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-desc">Description</Label>
            <Input id="sf-desc" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sf-content">Form Content / Template</Label>
            <Textarea id="sf-content" value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Form fields, instructions, or template content…" />
          </div>
          {initial && (
            <div className="flex items-center gap-2">
              <input
                id="sf-active"
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <Label htmlFor="sf-active">Active</Label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : (initial ? 'Save' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FormsTab({ canWrite, canManage }: { canWrite: boolean; canManage: boolean }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<SafetyFormCategory | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SafetyForm | null>(null)

  const { data, isLoading } = useSafetyForms({
    search: search || undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
  })
  const deleteForm = useDeleteSafetyForm()

  const forms = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Input placeholder="Search forms…" value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as SafetyFormCategory | 'ALL')}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {SAFETY_FORM_CATEGORY_LIST.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <PlusIcon className="h-4 w-4 mr-1" /> New Form
          </Button>
        )}
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RowSkeleton cols={5} />
            ) : forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No safety forms found. {canWrite && 'Create your first form template.'}
                </TableCell>
              </TableRow>
            ) : (
              forms.map(form => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">
                    <div>{form.title}</div>
                    {form.description && <div className="text-xs text-gray-500">{form.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="default">{form.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={form.isActive ? 'success' : 'default'}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {form.createdBy.firstName} {form.createdBy.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(form); setFormOpen(true) }}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => deleteForm.mutate(form.id)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <SafetyFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editTarget} />
    </div>
  )
}

// ─── Incident Reports Tab ──────────────────────────────────────────────────────

interface IncidentFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: IncidentReport | null
  projects: { id: string; name: string }[]
  canUpdateStatus: boolean
}

function IncidentFormDialog({ open, onOpenChange, initial, projects, canUpdateStatus }: IncidentFormDialogProps) {
  const createIncident = useCreateIncidentReport()
  const updateIncident = useUpdateIncidentReport()

  const [title, setTitle] = useState('')
  const [incidentType, setIncidentType] = useState<IncidentType>('NEAR_MISS')
  const [incidentDate, setIncidentDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [correctiveAction, setCorrectiveAction] = useState('')
  const [status, setStatus] = useState<IncidentStatus>('OPEN')
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setIncidentType(initial.incidentType as IncidentType)
      setIncidentDate(initial.incidentDate.slice(0, 10))
      setLocation(initial.location ?? '')
      setDescription(initial.description)
      setCorrectiveAction(initial.correctiveAction ?? '')
      setStatus(initial.status as IncidentStatus)
      setProjectId(initial.projectId ?? '')
    } else {
      setTitle(''); setIncidentType('NEAR_MISS'); setIncidentDate(''); setLocation('')
      setDescription(''); setCorrectiveAction(''); setStatus('OPEN'); setProjectId('')
    }
  }, [initial, open])

  const toIso = (d: string) => d ? new Date(d).toISOString() : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      await updateIncident.mutateAsync({
        id: initial.id,
        title,
        incidentType,
        incidentDate: toIso(incidentDate),
        location: location || null,
        description,
        correctiveAction: correctiveAction || null,
        status,
        projectId: projectId || null,
      })
    } else {
      await createIncident.mutateAsync({
        title,
        incidentType,
        incidentDate: toIso(incidentDate),
        location: location || undefined,
        description,
        projectId: projectId || undefined,
      })
    }
    onOpenChange(false)
  }

  const isPending = createIncident.isPending || updateIncident.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Incident Report' : 'Report Incident'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="ir-title">Title *</Label>
            <Input id="ir-title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select value={incidentType} onValueChange={v => setIncidentType(v as IncidentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_TYPE_LIST.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ir-date">Incident Date *</Label>
              <Input id="ir-date" type="date" value={incidentDate} onChange={e => setIncidentDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ir-loc">Location</Label>
              <Input id="ir-loc" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ir-desc">Description *</Label>
            <Textarea id="ir-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ir-corrective">Corrective Action</Label>
            <Textarea id="ir-corrective" value={correctiveAction} onChange={e => setCorrectiveAction(e.target.value)} rows={2} />
          </div>
          {initial && canUpdateStatus && (
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as IncidentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCIDENT_STATUS_LIST.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : (initial ? 'Save' : 'Report')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function IncidentsTab({
  canWrite,
  canManage,
  projects,
}: {
  canWrite: boolean
  canManage: boolean
  projects: { id: string; name: string }[]
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<IncidentReport | null>(null)

  const { data, isLoading } = useIncidentReports({
    search: search || undefined,
    incidentType: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  })
  const deleteIncident = useDeleteIncidentReport()

  const incidents = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input placeholder="Search incidents…" value={search} onChange={e => setSearch(e.target.value)} className="w-52" />
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v as IncidentType | 'ALL')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {INCIDENT_TYPE_LIST.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as IncidentStatus | 'ALL')}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {INCIDENT_STATUS_LIST.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
          <PlusIcon className="h-4 w-4 mr-1" /> Report Incident
        </Button>
      </div>
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RowSkeleton cols={7} />
            ) : incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No incident reports found.
                </TableCell>
              </TableRow>
            ) : (
              incidents.map(incident => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">
                    <div>{incident.title}</div>
                    {incident.location && <div className="text-xs text-gray-500">{incident.location}</div>}
                  </TableCell>
                  <TableCell><Badge variant="warning">{incident.incidentType.replace('_', ' ')}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(incident.incidentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={INCIDENT_STATUS_VARIANT[incident.status as IncidentStatus]}>
                      {INCIDENT_STATUSES[incident.status as IncidentStatus]?.label ?? incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{incident.project?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {incident.reportedBy.firstName} {incident.reportedBy.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditTarget(incident); setFormOpen(true) }}>
                          <PencilSquareIcon className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canManage && (
                        <Button variant="ghost" size="sm" onClick={() => deleteIncident.mutate(incident.id)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <IncidentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        projects={projects}
        canUpdateStatus={canWrite}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const { user } = useAuth()
  const userRoles = (user?.roles ?? []) as RoleName[]

  const canWrite = WRITE_ROLES.some(r => userRoles.includes(r))
  const canManage = MANAGE_ROLES.some(r => userRoles.includes(r))
  const canViewIncidents = INCIDENT_VIEW_ROLES.some(r => userRoles.includes(r))

  const [activeTab, setActiveTab] = useState<Tab>('documents')

  const { data: projectsData } = useProjects()
  const projects = (projectsData?.data ?? []).map(p => ({ id: p.id, name: p.name }))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'documents', label: 'Documents' },
    { key: 'sds', label: 'SDS Catalog' },
    { key: 'toolbox-talks', label: 'Toolbox Talks' },
    { key: 'forms', label: 'Forms' },
    ...(canViewIncidents ? [{ key: 'incidents' as Tab, label: 'Incidents' }] : []),
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Safety' }]} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Safety</h1>
        <p className="text-sm text-gray-500 mt-1">
          Safety documents, SDS catalog, toolbox talks, forms, and incident reports
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && (
        <DocumentsTab canWrite={canWrite} canManage={canManage} />
      )}
      {activeTab === 'sds' && (
        <SdsTab canWrite={canWrite} canManage={canManage} />
      )}
      {activeTab === 'toolbox-talks' && (
        <ToolboxTalksTab canWrite={canWrite} canManage={canManage} projects={projects} />
      )}
      {activeTab === 'forms' && (
        <FormsTab canWrite={canWrite} canManage={canManage} />
      )}
      {activeTab === 'incidents' && canViewIncidents && (
        <IncidentsTab canWrite={canWrite} canManage={canManage} projects={projects} />
      )}
    </div>
  )
}
