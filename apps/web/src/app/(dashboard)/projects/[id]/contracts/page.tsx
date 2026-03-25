'use client'

import { ArrowDownTrayIcon, PaperClipIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { use, useState } from 'react'

import {
  CONTRACT_DOCUMENT_STATUS_LIST,
  CONTRACT_DOCUMENT_STATUSES,
  CONTRACT_DOCUMENT_TYPE_LIST,
  CONTRACT_DOCUMENT_TYPES,
  CONTRACT_STATUS_LIST,
  CONTRACT_STATUSES,
  CONTRACT_TYPE_LIST,
  CONTRACT_TYPES,
  type Contract,
  type ContractDocument,
  type ContractDocumentStatus,
  type ContractDocumentType,
  type ContractStatus,
  type ContractType,
  type RoleName,
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
  useContractDocumentDownloadUrl,
  useContractDocumentUploadUrl,
  useContractDocuments,
  useContracts,
  useCreateContract,
  useCreateContractDocument,
  useDeleteContract,
  useDeleteContractDocument,
  useUpdateContract,
  useUpdateContractDocument,
} from '@/hooks/use-contracts'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin']

const STATUS_VARIANT: Record<ContractStatus, BadgeProps['variant']> = {
  DRAFT: 'default',
  PENDING_SIGNATURE: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'primary',
  TERMINATED: 'danger',
  ON_HOLD: 'outline',
}

const DOC_STATUS_VARIANT: Record<ContractDocumentStatus, BadgeProps['variant']> = {
  REQUESTED: 'warning',
  RECEIVED: 'success',
  EXPIRED: 'danger',
  WAIVED: 'default',
}

// ─── Contract List Panel ───────────────────────────────────────────────────────

function ContractListPanel({
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
  const { data: contracts = [], isLoading } = useContracts(projectId)
  const createContract = useCreateContract()
  const deleteContract = useDeleteContract(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Contract | null>(null)
  const [form, setForm] = useState({
    contractNumber: '',
    type: 'LUMP_SUM' as ContractType,
    amount: '',
    retentionRate: '',
    description: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = await createContract.mutateAsync({
      projectId,
      contractNumber: form.contractNumber,
      type: form.type,
      amount: Number(form.amount),
      retentionRate: form.retentionRate ? Number(form.retentionRate) : undefined,
      description: form.description || undefined,
    })
    setCreateOpen(false)
    setForm({ contractNumber: '', type: 'LUMP_SUM', amount: '', retentionRate: '', description: '' })
    onSelect(c.id)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteContract.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Contract
        </Button>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : contracts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No contracts yet.</p>
      ) : (
        contracts.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedId === c.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{c.contractNumber}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {CONTRACT_TYPES[c.type as ContractType]} · ${Number(c.amount).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={STATUS_VARIANT[c.status as ContractStatus]} className="text-xs">
                  {CONTRACT_STATUSES[c.status as ContractStatus] ?? c.status}
                </Badge>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(c) }}
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
          <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Contract Number *</Label>
              <Input
                value={form.contractNumber}
                onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
                placeholder="C-2026-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContractType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPE_LIST.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Retention Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.retentionRate}
                  onChange={(e) => setForm({ ...form, retentionRate: e.target.value })}
                  placeholder="10"
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
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createContract.isPending}>
                {createContract.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Contract</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete contract &quot;{deleteConfirm?.contractNumber}&quot;? All documents will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteContract.isPending}>
              {deleteContract.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Contract Detail Panel ────────────────────────────────────────────────────

function ContractDetailPanel({
  contract,
  canWrite,
}: {
  contract: Contract
  canWrite: boolean
}) {
  const updateContract = useUpdateContract()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({
    status: contract.status as ContractStatus,
    type: contract.type as ContractType,
    amount: String(contract.amount),
    retentionRate: contract.retentionRate ? String(contract.retentionRate) : '',
    customerProjectNumber: contract.customerProjectNumber ?? '',
    wageRequirements: contract.wageRequirements ?? '',
    taxStatus: contract.taxStatus ?? '',
    liquidatedDamages: contract.liquidatedDamages,
    liquidatedDamagesRate: contract.liquidatedDamagesRate ? String(contract.liquidatedDamagesRate) : '',
    bonded: contract.bonded,
    startDate: contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '',
    executedDate: contract.executedDate ? new Date(contract.executedDate).toISOString().slice(0, 10) : '',
    billingDate: contract.billingDate ? new Date(contract.billingDate).toISOString().slice(0, 10) : '',
    description: contract.description ?? '',
    notes: contract.notes ?? '',
  })

  const openEdit = () => {
    setForm({
      status: contract.status as ContractStatus,
      type: contract.type as ContractType,
      amount: String(contract.amount),
      retentionRate: contract.retentionRate ? String(contract.retentionRate) : '',
      customerProjectNumber: contract.customerProjectNumber ?? '',
      wageRequirements: contract.wageRequirements ?? '',
      taxStatus: contract.taxStatus ?? '',
      liquidatedDamages: contract.liquidatedDamages,
      liquidatedDamagesRate: contract.liquidatedDamagesRate ? String(contract.liquidatedDamagesRate) : '',
      bonded: contract.bonded,
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : '',
      executedDate: contract.executedDate ? new Date(contract.executedDate).toISOString().slice(0, 10) : '',
      billingDate: contract.billingDate ? new Date(contract.billingDate).toISOString().slice(0, 10) : '',
      description: contract.description ?? '',
      notes: contract.notes ?? '',
    })
    setEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateContract.mutateAsync({
      id: contract.id,
      status: form.status,
      type: form.type,
      amount: Number(form.amount),
      retentionRate: form.retentionRate ? Number(form.retentionRate) : undefined,
      customerProjectNumber: form.customerProjectNumber || undefined,
      wageRequirements: form.wageRequirements || undefined,
      taxStatus: form.taxStatus || undefined,
      liquidatedDamages: form.liquidatedDamages,
      liquidatedDamagesRate: form.liquidatedDamagesRate ? Number(form.liquidatedDamagesRate) : undefined,
      bonded: form.bonded,
      startDate: form.startDate || undefined,
      executedDate: form.executedDate || undefined,
      billingDate: form.billingDate || undefined,
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
          <Badge variant={STATUS_VARIANT[contract.status as ContractStatus]}>
            {CONTRACT_STATUSES[contract.status as ContractStatus] ?? contract.status}
          </Badge>
          <span className="text-sm text-gray-500">{CONTRACT_TYPES[contract.type as ContractType]}</span>
        </div>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <Field label="Contract Number" value={contract.contractNumber} />
        <Field label="Amount" value={`$${Number(contract.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
        <Field label="Retention Rate" value={contract.retentionRate ? `${contract.retentionRate}%` : undefined} />
        <Field label="Start Date" value={contract.startDate ? new Date(contract.startDate).toLocaleDateString() : undefined} />
        <Field label="Executed Date" value={contract.executedDate ? new Date(contract.executedDate).toLocaleDateString() : undefined} />
        <Field label="Billing Date" value={contract.billingDate ? new Date(contract.billingDate).toLocaleDateString() : undefined} />
        <Field label="Customer Project #" value={contract.customerProjectNumber} />
        <Field label="Bonded" value={contract.bonded ? 'Yes' : 'No'} />
        <Field label="Liquidated Damages" value={contract.liquidatedDamages ? (contract.liquidatedDamagesRate ? `$${Number(contract.liquidatedDamagesRate).toLocaleString()}/day` : 'Yes') : 'No'} />
        {contract.wageRequirements && <Field label="Wage Requirements" value={contract.wageRequirements} />}
        {contract.taxStatus && <Field label="Tax Status" value={contract.taxStatus} />}
        {contract.proposal && <Field label="Linked Proposal" value={String(contract.proposal.proposalNumber)} />}
        {contract.description && (
          <div className="col-span-3">
            <dt className="text-xs font-medium text-gray-500">Description</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{contract.description}</dd>
          </div>
        )}
        {contract.notes && (
          <div className="col-span-3">
            <dt className="text-xs font-medium text-gray-500">Notes</dt>
            <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">{contract.notes}</dd>
          </div>
        )}
      </dl>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUS_LIST.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContractType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_LIST.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Retention Rate (%)</Label>
                <Input type="number" step="0.01" min="0" max="100" value={form.retentionRate} onChange={(e) => setForm({ ...form, retentionRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Executed Date</Label>
                <Input type="date" value={form.executedDate} onChange={(e) => setForm({ ...form, executedDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Billing Date</Label>
                <Input type="date" value={form.billingDate} onChange={(e) => setForm({ ...form, billingDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Customer Project #</Label>
                <Input value={form.customerProjectNumber} onChange={(e) => setForm({ ...form, customerProjectNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Wage Requirements</Label>
                <Input value={form.wageRequirements} onChange={(e) => setForm({ ...form, wageRequirements: e.target.value })} placeholder="Prevailing wage, etc." />
              </div>
              <div className="space-y-2">
                <Label>Tax Status</Label>
                <Input value={form.taxStatus} onChange={(e) => setForm({ ...form, taxStatus: e.target.value })} placeholder="Exempt, taxable, etc." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bonded"
                  checked={form.bonded}
                  onChange={(e) => setForm({ ...form, bonded: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="bonded">Bonded</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="liquidatedDamages"
                  checked={form.liquidatedDamages}
                  onChange={(e) => setForm({ ...form, liquidatedDamages: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="liquidatedDamages">Liquidated Damages</Label>
              </div>
            </div>
            {form.liquidatedDamages && (
              <div className="space-y-2">
                <Label>Liquidated Damages Rate ($/day)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.liquidatedDamagesRate}
                  onChange={(e) => setForm({ ...form, liquidatedDamagesRate: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={updateContract.isPending}>
                {updateContract.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Documents Panel ──────────────────────────────────────────────────────────

function DocumentsPanel({
  contractId,
  canWrite,
}: {
  contractId: string
  canWrite: boolean
}) {
  const { data: contractDocs = [], isLoading } = useContractDocuments(contractId)
  const createDoc = useCreateContractDocument(contractId)
  const updateDoc = useUpdateContractDocument(contractId)
  const deleteDoc = useDeleteContractDocument(contractId)
  const getUploadUrl = useContractDocumentUploadUrl(contractId)
  const getDownloadUrl = useContractDocumentDownloadUrl(contractId)

  const [addOpen, setAddOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<ContractDocument | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ContractDocument | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'INSURANCE' as ContractDocumentType,
    name: '',
    notes: '',
    expiresAt: '',
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createDoc.mutateAsync({
      type: form.type,
      name: form.name,
      notes: form.notes || undefined,
      expiresAt: form.expiresAt || undefined,
    })
    setAddOpen(false)
    setForm({ type: 'INSURANCE', name: '', notes: '', expiresAt: '' })
  }

  const handleUpdateStatus = async (doc: ContractDocument, status: ContractDocumentStatus) => {
    await updateDoc.mutateAsync({ id: doc.id, status })
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteDoc.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleUpload = async (doc: ContractDocument, file: File) => {
    setUploadingId(doc.id)
    try {
      const { url } = await getUploadUrl.mutateAsync(doc.id)
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      await updateDoc.mutateAsync({
        id: doc.id,
        status: 'RECEIVED',
        receivedAt: new Date().toISOString(),
      })
    } finally {
      setUploadingId(null)
    }
  }

  const handleDownload = async (doc: ContractDocument) => {
    const { url } = await getDownloadUrl.mutateAsync(doc.id)
    window.open(url, '_blank')
  }

  if (isLoading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Document
          </Button>
        </div>
      )}

      {contractDocs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No documents added yet.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="text-sm">
                    {CONTRACT_DOCUMENT_TYPES[doc.type as ContractDocumentType]}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant={DOC_STATUS_VARIANT[doc.status as ContractDocumentStatus]} className="text-xs">
                      {CONTRACT_DOCUMENT_STATUSES[doc.status as ContractDocumentStatus] ?? doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    {doc.fileName ? (
                      <span className="text-xs text-gray-600 truncate max-w-[120px] block">{doc.fileName}</span>
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
                            <span>
                              <PaperClipIcon className="h-3.5 w-3.5" />
                            </span>
                          </Button>
                        </label>
                      )}
                      {doc.fileKey && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => setEditDoc(doc)}>
                            <PencilSquareIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(doc)}>
                            <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </>
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
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContractDocumentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRACT_DOCUMENT_TYPE_LIST.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="COI 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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

      <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Document Status</DialogTitle></DialogHeader>
          {editDoc && (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">{editDoc.name}</p>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editDoc.status}
                  onValueChange={(v) => {
                    handleUpdateStatus(editDoc, v as ContractDocumentStatus)
                    setEditDoc(null)
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_DOCUMENT_STATUS_LIST.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setEditDoc(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Document</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">Delete &quot;{deleteConfirm?.name}&quot;?</p>
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

export default function ContractsPage({
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
  const { data: contracts = [] } = useContracts(projectId)
  const selectedContract = contracts.find((c) => c.id === selectedId) ?? null

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6 min-h-[400px]">
      {/* Left — contract list */}
      <div className="border-r border-gray-200 pr-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contracts</h2>
        <ContractListPanel
          projectId={projectId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          canWrite={canWrite}
          canDelete={canDelete}
        />
      </div>

      {/* Right — detail */}
      <div>
        {!selectedContract ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Select a contract to view details.
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">{selectedContract.contractNumber}</h2>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <ContractDetailPanel contract={selectedContract} canWrite={canWrite} />
              </TabsContent>
              <TabsContent value="documents" className="mt-4">
                <DocumentsPanel contractId={selectedContract.id} canWrite={canWrite} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
