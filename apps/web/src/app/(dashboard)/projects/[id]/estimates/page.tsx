'use client'

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { use, useState } from 'react'

import {
  ESTIMATE_STATUS_LIST,
  ESTIMATE_STATUSES,
  ESTIMATE_UNIT_LIST,
  type BidResult,
  type Estimate,
  type EstimateItemWithQuotes,
  type EstimateStatus,
  type EstimateUnit,
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
  useBidResults,
  useCreateBidResult,
  useCreateEstimate,
  useCreateEstimateItem,
  useDeleteBidResult,
  useDeleteEstimate,
  useDeleteEstimateItem,
  useEstimate,
  useEstimates,
  useUpdateBidResult,
  useUpdateEstimate,
  useUpdateEstimateItem,
} from '@/hooks/use-estimation'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'Superintendent']
const MANAGE_ROLES: RoleName[] = ['Admin', 'ProjectManager']
const ADMIN_ROLES: RoleName[] = ['Admin']

const STATUS_VARIANT: Record<EstimateStatus, BadgeProps['variant']> = {
  DRAFT: 'default',
  ACTIVE: 'primary',
  AWARDED: 'success',
  LOST: 'danger',
}

// ─── Estimate List Panel ──────────────────────────────────────────────────────

function EstimateListPanel({
  projectId,
  selectedId,
  onSelect,
  canManage,
  canAdminDelete,
}: {
  projectId: string
  selectedId: string | null
  onSelect: (id: string) => void
  canManage: boolean
  canAdminDelete: boolean
}) {
  const { data: estimates = [], isLoading } = useEstimates(projectId)
  const createEstimate = useCreateEstimate(projectId)
  const deleteEstimate = useDeleteEstimate(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Estimate | null>(null)
  const [form, setForm] = useState({ name: '', description: '', notes: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const est = await createEstimate.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      notes: form.notes || undefined,
    })
    setCreateOpen(false)
    setForm({ name: '', description: '', notes: '' })
    onSelect(est.id)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteEstimate.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-3">
      {canManage && (
        <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Estimate
        </Button>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : estimates.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No estimates yet.</p>
      ) : (
        estimates.map((est) => (
          <div
            key={est.id}
            onClick={() => onSelect(est.id)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedId === est.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{est.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">${Number(est.totalCost).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={STATUS_VARIANT[est.status as EstimateStatus]} className="text-xs">
                  {ESTIMATE_STATUSES[est.status as EstimateStatus]?.label ?? est.status}
                </Badge>
                {canAdminDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(est) }}
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
          <DialogHeader><DialogTitle>New Estimate</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Phase 1 Estimate" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createEstimate.isPending}>
                {createEstimate.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Estimate</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete &quot;{deleteConfirm?.name}&quot;? All items, quotes, and bid results will be removed.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteEstimate.isPending}>
              {deleteEstimate.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Line Items Panel ─────────────────────────────────────────────────────────

function LineItemsPanel({
  projectId,
  estimateId,
  canWrite,
}: {
  projectId: string
  estimateId: string
  canWrite: boolean
}) {
  const { data: estimate, isLoading } = useEstimate(projectId, estimateId)
  const createItem = useCreateEstimateItem(projectId, estimateId)
  const updateItem = useUpdateEstimateItem(projectId, estimateId)
  const deleteItem = useDeleteEstimateItem(projectId, estimateId)
  const updateEstimate = useUpdateEstimate(projectId)

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<EstimateItemWithQuotes | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<EstimateItemWithQuotes | null>(null)
  const [editStatus, setEditStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EstimateStatus>('DRAFT')

  const [form, setForm] = useState({
    description: '',
    quantity: '',
    unit: 'EA' as EstimateUnit,
    unitCost: '',
    costCode: '',
    notes: '',
  })

  const items = estimate?.items ?? []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createItem.mutateAsync({
      description: form.description,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitCost: Number(form.unitCost),
      costCode: form.costCode || undefined,
      notes: form.notes || undefined,
    })
    setAddOpen(false)
    setForm({ description: '', quantity: '', unit: 'EA', unitCost: '', costCode: '', notes: '' })
  }

  const handleOpenEdit = (item: EstimateItemWithQuotes) => {
    setForm({
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit as EstimateUnit,
      unitCost: String(item.unitCost),
      costCode: item.costCode ?? '',
      notes: item.notes ?? '',
    })
    setEditItem(item)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    await updateItem.mutateAsync({
      id: editItem.id,
      description: form.description,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitCost: Number(form.unitCost),
      costCode: form.costCode || null,
      notes: form.notes || null,
    })
    setEditItem(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteItem.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleStatusSave = async () => {
    await updateEstimate.mutateAsync({ id: estimateId, status: selectedStatus })
    setEditStatus(false)
  }

  const openStatusEdit = () => {
    setSelectedStatus((estimate?.status as EstimateStatus) ?? 'DRAFT')
    setEditStatus(true)
  }

  const ItemForm = ({ onSubmit, isPending, submitLabel }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Description *</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Concrete flatwork" required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Qty *</Label>
          <Input type="number" step="0.0001" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Unit *</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as EstimateUnit })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ESTIMATE_UNIT_LIST.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit Cost *</Label>
          <Input type="number" step="0.0001" min="0" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Cost Code</Label>
          <Input value={form.costCode} onChange={(e) => setForm({ ...form, costCode: e.target.value })} placeholder="03300" />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  )

  if (isLoading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[estimate?.status as EstimateStatus]}>
            {ESTIMATE_STATUSES[estimate?.status as EstimateStatus]?.label ?? estimate?.status}
          </Badge>
          {canWrite && (
            <Button variant="ghost" size="sm" onClick={openStatusEdit}>
              <PencilSquareIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            Total: <span className="text-lg font-bold text-gray-900">${Number(estimate?.totalCost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
          {canWrite && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  No line items.{' '}
                  {canWrite && <button onClick={() => setAddOpen(true)} className="text-blue-600 hover:underline">Add the first one.</button>}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm">{item.description}</TableCell>
                  <TableCell className="text-gray-500 text-sm font-mono">{item.costCode ?? '-'}</TableCell>
                  <TableCell className="text-right text-sm">{Number(item.quantity).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{item.unit}</TableCell>
                  <TableCell className="text-right text-sm">${Number(item.unitCost).toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">${Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(item)}>
                          <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
          <ItemForm onSubmit={handleAdd} isPending={createItem.isPending} submitLabel="Add Item" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Line Item</DialogTitle></DialogHeader>
          <ItemForm onSubmit={handleUpdate} isPending={updateItem.isPending} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Line Item</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">Remove &quot;{deleteConfirm?.description}&quot;?</p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteItem.isPending}>
              {deleteItem.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editStatus} onOpenChange={setEditStatus}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as EstimateStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESTIMATE_STATUS_LIST.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditStatus(false)}>Cancel</Button>
              <Button onClick={handleStatusSave} disabled={updateEstimate.isPending}>
                {updateEstimate.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Bid Results Panel ────────────────────────────────────────────────────────

function BidResultsPanel({
  projectId,
  estimateId,
  canManage,
}: {
  projectId: string
  estimateId: string
  canManage: boolean
}) {
  const { data: results = [], isLoading } = useBidResults(projectId, estimateId)
  const createResult = useCreateBidResult(projectId, estimateId)
  const updateResult = useUpdateBidResult(projectId, estimateId)
  const deleteResult = useDeleteBidResult(projectId, estimateId)

  const [addOpen, setAddOpen] = useState(false)
  const [editResult, setEditResult] = useState<BidResult | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<BidResult | null>(null)
  const [form, setForm] = useState({ competitorName: '', bidAmount: '', submittedAt: '', notes: '', isAwarded: false })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createResult.mutateAsync({
      competitorName: form.competitorName,
      bidAmount: Number(form.bidAmount),
      submittedAt: form.submittedAt ? new Date(form.submittedAt).toISOString() : new Date().toISOString(),
      notes: form.notes || undefined,
      isAwarded: form.isAwarded,
    })
    setAddOpen(false)
    setForm({ competitorName: '', bidAmount: '', submittedAt: '', notes: '', isAwarded: false })
  }

  const handleOpenEdit = (r: BidResult) => {
    setForm({
      competitorName: r.competitorName,
      bidAmount: String(r.bidAmount),
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString().slice(0, 10) : '',
      notes: r.notes ?? '',
      isAwarded: r.isAwarded,
    })
    setEditResult(r)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editResult) return
    await updateResult.mutateAsync({
      id: editResult.id,
      competitorName: form.competitorName,
      bidAmount: Number(form.bidAmount),
      notes: form.notes || null,
      isAwarded: form.isAwarded,
    })
    setEditResult(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteResult.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const BidForm = ({ onSubmit, isPending, submitLabel, showDate }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean; submitLabel: string; showDate?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Competitor Name *</Label>
        <Input value={form.competitorName} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Bid Amount *</Label>
          <Input type="number" step="0.01" min="0" value={form.bidAmount} onChange={(e) => setForm({ ...form, bidAmount: e.target.value })} required />
        </div>
        {showDate && (
          <div className="space-y-2">
            <Label>Submitted At</Label>
            <Input type="date" value={form.submittedAt} onChange={(e) => setForm({ ...form, submittedAt: e.target.value })} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAwarded"
          checked={form.isAwarded}
          onChange={(e) => setForm({ ...form, isAwarded: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isAwarded">Awarded</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Competitor Bid
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No bid results recorded.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competitor</TableHead>
                <TableHead className="text-right">Bid Amount</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Awarded</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.competitorName}</TableCell>
                  <TableCell className="text-right">${Number(r.bidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isAwarded ? 'success' : 'default'}>
                      {r.isAwarded ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)}>
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(r)}>
                          <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Competitor Bid</DialogTitle></DialogHeader>
          <BidForm onSubmit={handleAdd} isPending={createResult.isPending} submitLabel="Add" showDate />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editResult} onOpenChange={() => setEditResult(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Bid Result</DialogTitle></DialogHeader>
          <BidForm onSubmit={handleUpdate} isPending={updateResult.isPending} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Bid Result</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">Remove bid from &quot;{deleteConfirm?.competitorName}&quot;?</p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteResult.isPending}>
              {deleteResult.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstimatesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const canWrite = WRITE_ROLES.some((r) => userRoles.includes(r))
  const canManage = MANAGE_ROLES.some((r) => userRoles.includes(r))
  const canAdminDelete = ADMIN_ROLES.some((r) => userRoles.includes(r))

  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6 min-h-[400px]">
      {/* Left — estimate list */}
      <div className="border-r border-gray-200 pr-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Estimates</h2>
        <EstimateListPanel
          projectId={projectId}
          selectedId={selectedEstimateId}
          onSelect={setSelectedEstimateId}
          canManage={canManage}
          canAdminDelete={canAdminDelete}
        />
      </div>

      {/* Right — detail */}
      <div>
        {!selectedEstimateId ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Select an estimate to view details.
          </div>
        ) : (
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="bids">Bid Results</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
              <LineItemsPanel projectId={projectId} estimateId={selectedEstimateId} canWrite={canWrite} />
            </TabsContent>
            <TabsContent value="bids" className="mt-4">
              <BidResultsPanel projectId={projectId} estimateId={selectedEstimateId} canManage={canManage} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
