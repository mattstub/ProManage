'use client'

import {
  ArrowDownTrayIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { use, useState } from 'react'

import {
  BALL_IN_COURT_OPTIONS,
  SUBMITTAL_STATUS_LIST,
  SUBMITTAL_STATUSES,
  SUBMITTAL_TYPE_LIST,
  SUBMITTAL_TYPES,
  type RoleName,
  type Submittal,
  type SubmittalDocument,
  type SubmittalStatus,
  type SubmittalType,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  type BadgeProps,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import {
  useCreateSubmittal,
  useCreateSubmittalDocument,
  useDeleteSubmittal,
  useDeleteSubmittalDocument,
  useSubmittalDocumentDownloadUrl,
  useSubmittalDocumentUploadUrl,
  useSubmittalDocuments,
  useSubmittals,
  useUpdateSubmittal,
  useUpdateSubmittalDocument,
} from '@/hooks/use-submittals'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']

const STATUS_VARIANT: Record<SubmittalStatus, BadgeProps['variant']> = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  APPROVED_AS_NOTED: 'success',
  REVISE_RESUBMIT: 'warning',
  REJECTED: 'danger',
  VOID: 'outline',
}

// ─── Submittal List Panel ─────────────────────────────────────────────────────

function SubmittalListPanel({
  projectId,
  selectedId,
  onSelect,
  canWrite,
  canDelete,
}: {
  projectId: string
  selectedId: string | null
  onSelect: (id: string) => void
  canWrite: boolean
  canDelete: boolean
}) {
  const { data: submittals = [], isLoading } = useSubmittals(projectId)
  const createSubmittal = useCreateSubmittal()
  const deleteSubmittal = useDeleteSubmittal(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Submittal | null>(null)
  const [form, setForm] = useState({
    submittalNumber: '',
    title: '',
    specSection: '',
    type: 'SHOP_DRAWINGS' as SubmittalType,
    description: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const s = await createSubmittal.mutateAsync({
      projectId,
      submittalNumber: form.submittalNumber,
      title: form.title,
      type: form.type,
      specSection: form.specSection || undefined,
      description: form.description || undefined,
    })
    setCreateOpen(false)
    setForm({ submittalNumber: '', title: '', specSection: '', type: 'SHOP_DRAWINGS', description: '' })
    onSelect(s.id)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteSubmittal.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Submittal
        </Button>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : submittals.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No submittals yet.</p>
      ) : (
        submittals.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedId === s.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {s.submittalNumber} — {s.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {SUBMITTAL_TYPES[s.type as SubmittalType]}
                  {s.specSection ? ` · ${s.specSection}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={STATUS_VARIANT[s.status as SubmittalStatus]} className="text-xs">
                  {SUBMITTAL_STATUSES[s.status as SubmittalStatus] ?? s.status}
                </Badge>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(s) }}
                  >
                    <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Submittal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Submittal Number *</Label>
                <Input
                  value={form.submittalNumber}
                  onChange={(e) => setForm({ ...form, submittalNumber: e.target.value })}
                  placeholder="S-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Spec Section</Label>
                <Input
                  value={form.specSection}
                  onChange={(e) => setForm({ ...form, specSection: e.target.value })}
                  placeholder="03-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Concrete Mix Design"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as SubmittalType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBMITTAL_TYPE_LIST.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createSubmittal.isPending}>
                {createSubmittal.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Submittal</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete submittal &quot;{deleteConfirm?.submittalNumber}&quot;? All attachments will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteSubmittal.isPending}>
              {deleteSubmittal.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Submittal Detail Panel ───────────────────────────────────────────────────

function SubmittalDetailPanel({
  submittal,
  canWrite,
}: {
  submittal: Submittal
  canWrite: boolean
}) {
  const updateSubmittal = useUpdateSubmittal()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    status: submittal.status as SubmittalStatus,
    type: submittal.type as SubmittalType,
    title: submittal.title,
    specSection: submittal.specSection ?? '',
    revision: String(submittal.revision),
    submittedDate: submittal.submittedDate
      ? new Date(submittal.submittedDate).toISOString().slice(0, 10)
      : '',
    requiredByDate: submittal.requiredByDate
      ? new Date(submittal.requiredByDate).toISOString().slice(0, 10)
      : '',
    returnedDate: submittal.returnedDate
      ? new Date(submittal.returnedDate).toISOString().slice(0, 10)
      : '',
    ballInCourt: submittal.ballInCourt ?? '',
    approver: submittal.approver ?? '',
    description: submittal.description ?? '',
    notes: submittal.notes ?? '',
  })

  const openEdit = () => {
    setForm({
      status: submittal.status as SubmittalStatus,
      type: submittal.type as SubmittalType,
      title: submittal.title,
      specSection: submittal.specSection ?? '',
      revision: String(submittal.revision),
      submittedDate: submittal.submittedDate
        ? new Date(submittal.submittedDate).toISOString().slice(0, 10)
        : '',
      requiredByDate: submittal.requiredByDate
        ? new Date(submittal.requiredByDate).toISOString().slice(0, 10)
        : '',
      returnedDate: submittal.returnedDate
        ? new Date(submittal.returnedDate).toISOString().slice(0, 10)
        : '',
      ballInCourt: submittal.ballInCourt ?? '',
      approver: submittal.approver ?? '',
      description: submittal.description ?? '',
      notes: submittal.notes ?? '',
    })
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateSubmittal.mutateAsync({
      id: submittal.id,
      status: form.status,
      type: form.type,
      title: form.title,
      specSection: form.specSection || undefined,
      revision: Number(form.revision),
      submittedDate: form.submittedDate
        ? new Date(form.submittedDate).toISOString()
        : undefined,
      requiredByDate: form.requiredByDate
        ? new Date(form.requiredByDate).toISOString()
        : undefined,
      returnedDate: form.returnedDate
        ? new Date(form.returnedDate).toISOString()
        : undefined,
      ballInCourt: form.ballInCourt || undefined,
      approver: form.approver || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
    })
    setEditOpen(false)
  }

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[submittal.status as SubmittalStatus]}>
            {SUBMITTAL_STATUSES[submittal.status as SubmittalStatus] ?? submittal.status}
          </Badge>
          <span className="text-sm text-gray-500">
            {SUBMITTAL_TYPES[submittal.type as SubmittalType]}
          </span>
          <span className="text-xs text-gray-400">Rev {submittal.revision}</span>
        </div>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <Field label="Submittal Number" value={submittal.submittalNumber} />
        <Field label="Spec Section" value={submittal.specSection} />
        <Field label="Revision" value={String(submittal.revision)} />
        <Field
          label="Submitted Date"
          value={submittal.submittedDate
            ? new Date(submittal.submittedDate).toLocaleDateString()
            : undefined}
        />
        <Field
          label="Required By"
          value={submittal.requiredByDate
            ? new Date(submittal.requiredByDate).toLocaleDateString()
            : undefined}
        />
        <Field
          label="Returned Date"
          value={submittal.returnedDate
            ? new Date(submittal.returnedDate).toLocaleDateString()
            : undefined}
        />
        <Field label="Ball in Court" value={submittal.ballInCourt} />
        <Field label="Approver" value={submittal.approver} />
        {submittal.description && (
          <div className="col-span-3">
            <dt className="text-xs font-medium text-gray-500">Description</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{submittal.description}</dd>
          </div>
        )}
        {submittal.notes && (
          <div className="col-span-3">
            <dt className="text-xs font-medium text-gray-500">Notes</dt>
            <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{submittal.notes}</dd>
          </div>
        )}
      </dl>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Submittal</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as SubmittalStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBMITTAL_STATUS_LIST.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as SubmittalType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBMITTAL_TYPE_LIST.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Spec Section</Label>
                <Input
                  value={form.specSection}
                  onChange={(e) => setForm({ ...form, specSection: e.target.value })}
                  placeholder="03-300"
                />
              </div>
              <div className="space-y-2">
                <Label>Revision</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.revision}
                  onChange={(e) => setForm({ ...form, revision: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Submitted Date</Label>
                <Input
                  type="date"
                  value={form.submittedDate}
                  onChange={(e) => setForm({ ...form, submittedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Required By</Label>
                <Input
                  type="date"
                  value={form.requiredByDate}
                  onChange={(e) => setForm({ ...form, requiredByDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Returned Date</Label>
                <Input
                  type="date"
                  value={form.returnedDate}
                  onChange={(e) => setForm({ ...form, returnedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ball in Court</Label>
                <Select
                  value={form.ballInCourt}
                  onValueChange={(v) => setForm({ ...form, ballInCourt: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {BALL_IN_COURT_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Approver</Label>
                <Input
                  value={form.approver}
                  onChange={(e) => setForm({ ...form, approver: e.target.value })}
                  placeholder="Architect or engineer name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={updateSubmittal.isPending}>
                {updateSubmittal.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Attachments Panel ────────────────────────────────────────────────────────

function AttachmentsPanel({
  submittalId,
  canWrite,
}: {
  submittalId: string
  canWrite: boolean
}) {
  const { data: docs = [], isLoading } = useSubmittalDocuments(submittalId)
  const createDoc = useCreateSubmittalDocument(submittalId)
  const updateDoc = useUpdateSubmittalDocument(submittalId)
  const deleteDoc = useDeleteSubmittalDocument(submittalId)
  const getUploadUrl = useSubmittalDocumentUploadUrl(submittalId)
  const getDownloadUrl = useSubmittalDocumentDownloadUrl(submittalId)

  const [addOpen, setAddOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<SubmittalDocument | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', notes: '' })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createDoc.mutateAsync({
      name: form.name,
      notes: form.notes || undefined,
    })
    setAddOpen(false)
    setForm({ name: '', notes: '' })
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteDoc.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleUpload = async (doc: SubmittalDocument, file: File) => {
    setUploadingId(doc.id)
    try {
      const { url } = await getUploadUrl.mutateAsync(doc.id)
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      await updateDoc.mutateAsync({ id: doc.id, name: doc.name })
    } finally {
      setUploadingId(null)
    }
  }

  const handleDownload = async (doc: SubmittalDocument) => {
    const { url } = await getDownloadUrl.mutateAsync(doc.id)
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Attachment
          </Button>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No attachments yet.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-sm">{doc.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{doc.notes ?? '—'}</TableCell>
                  <TableCell>
                    {doc.fileName ? (
                      <span className="text-xs text-gray-600 truncate max-w-[120px] block">
                        {doc.fileName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No file</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(doc, file)
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={uploadingId === doc.id}
                            asChild
                          >
                            <span><PaperClipIcon className="h-3.5 w-3.5" /></span>
                          </Button>
                        </label>
                      )}
                      {doc.fileKey && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(doc)}
                        >
                          <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Attachment</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Concrete Mix Design Rev 1.pdf"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createDoc.isPending}>
                {createDoc.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Attachment</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete &quot;{deleteConfirm?.name}&quot;?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteDoc.isPending}>
              {deleteDoc.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmittalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const canWrite = WRITE_ROLES.some((r) => userRoles.includes(r))
  const canDelete = DELETE_ROLES.some((r) => userRoles.includes(r))

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: submittals = [] } = useSubmittals(projectId)
  const selectedSubmittal = submittals.find((s) => s.id === selectedId) ?? null

  return (
    <div className="grid grid-cols-[300px_1fr] gap-6 min-h-[400px]">
      {/* Left — submittal list */}
      <div className="border-r border-gray-200 pr-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Submittal Log
        </h2>
        <SubmittalListPanel
          projectId={projectId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      </div>

      {/* Right — detail */}
      <div>
        {!selectedSubmittal ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Select a submittal to view details.
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedSubmittal.submittalNumber} — {selectedSubmittal.title}
            </h2>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <SubmittalDetailPanel submittal={selectedSubmittal} canWrite={canWrite} />
              </TabsContent>
              <TabsContent value="attachments" className="mt-4">
                <AttachmentsPanel submittalId={selectedSubmittal.id} canWrite={canWrite} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
