'use client'

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import {
  MATERIAL_UNIT_LIST,
  type CostCode,
  type Material,
  type MaterialUnit,
  type RoleName,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import {
  useCostCodes,
  useCreateCostCode,
  useCreateMaterial,
  useDeleteCostCode,
  useDeleteMaterial,
  useMaterialPriceHistory,
  useMaterials,
  useUpdateCostCode,
  useUpdateMaterial,
} from '@/hooks/use-materials'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const MANAGE_ROLES: RoleName[] = ['Admin', 'OfficeAdmin']

// ─── Cost Codes Tab ───────────────────────────────────────────────────────────

function CostCodesTab({ canManage }: { canManage: boolean }) {
  const { data: costCodes = [], isLoading } = useCostCodes()
  const createCostCode = useCreateCostCode()
  const updateCostCode = useUpdateCostCode()
  const deleteCostCode = useDeleteCostCode()

  const [createOpen, setCreateOpen] = useState(false)
  const [editCode, setEditCode] = useState<CostCode | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CostCode | null>(null)
  const [form, setForm] = useState({ code: '', description: '' })

  const handleOpenCreate = () => {
    setForm({ code: '', description: '' })
    setCreateOpen(true)
  }

  const handleOpenEdit = (cc: CostCode) => {
    setForm({ code: cc.code, description: cc.description ?? '' })
    setEditCode(cc)
  }

  const handleClose = () => {
    setCreateOpen(false)
    setEditCode(null)
    setDeleteConfirm(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCostCode.mutateAsync({ code: form.code, description: form.description })
    handleClose()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCode) return
    await updateCostCode.mutateAsync({ id: editCode.id, code: form.code, description: form.description || undefined })
    handleClose()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteCostCode.mutateAsync(deleteConfirm.id)
    handleClose()
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={handleOpenCreate} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Cost Code
          </Button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : costCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No cost codes.{' '}
                  {canManage && (
                    <button onClick={handleOpenCreate} className="text-blue-600 hover:underline">
                      Add the first one.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              costCodes.map((cc) => (
                <TableRow key={cc.id}>
                  <TableCell className="font-mono font-medium">{cc.code}</TableCell>
                  <TableCell className="text-gray-600">{cc.description ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cc)}>
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(cc)}>
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Cost Code</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cc-code">Code *</Label>
              <Input id="cc-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 03300" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-desc">Description</Label>
              <Input id="cc-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Concrete" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createCostCode.isPending}>
                {createCostCode.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editCode} onOpenChange={() => setEditCode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Cost Code</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cc-code">Code *</Label>
              <Input id="edit-cc-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cc-desc">Description</Label>
              <Input id="edit-cc-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={updateCostCode.isPending}>
                {updateCostCode.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Cost Code</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete &quot;{deleteConfirm?.code}&quot;? This will fail if any materials are linked to it.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteCostCode.isPending}>
              {deleteCostCode.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Price History Dialog ─────────────────────────────────────────────────────

function PriceHistoryDialog({ material, onClose }: { material: Material | null; onClose: () => void }) {
  const { data: history = [], isLoading } = useMaterialPriceHistory(material?.id ?? '')

  return (
    <Dialog open={!!material} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Price History — {material?.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No price history recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Unit Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${Number(entry.unitCost).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Materials Tab ────────────────────────────────────────────────────────────

interface MaterialFormData {
  name: string
  description: string
  sku: string
  unit: MaterialUnit
  unitCost: string
  supplier: string
  costCodeId: string
  isActive: boolean
}

const initialMaterialForm: MaterialFormData = {
  name: '',
  description: '',
  sku: '',
  unit: 'EA',
  unitCost: '',
  supplier: '',
  costCodeId: '',
  isActive: true,
}

function MaterialsTab({ canWrite }: { canWrite: boolean }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterUnit, setFilterUnit] = useState<MaterialUnit | 'ALL'>('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: materialsResult, isLoading } = useMaterials({
    page,
    perPage: 20,
    search: debouncedSearch || undefined,
    unit: filterUnit !== 'ALL' ? filterUnit : undefined,
  })
  const { data: costCodes = [] } = useCostCodes()

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const deleteMaterial = useDeleteMaterial()

  const [createOpen, setCreateOpen] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null)
  const [priceHistoryMaterial, setPriceHistoryMaterial] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialFormData>(initialMaterialForm)

  const materials = materialsResult?.data ?? []
  const totalPages = materialsResult?.meta?.totalPages ?? 1

  const handleOpenCreate = () => {
    setForm(initialMaterialForm)
    setCreateOpen(true)
  }

  const handleOpenEdit = (m: Material) => {
    setForm({
      name: m.name,
      description: m.description ?? '',
      sku: m.sku ?? '',
      unit: m.unit,
      unitCost: String(m.unitCost),
      supplier: m.supplier ?? '',
      costCodeId: m.costCodeId ?? '',
      isActive: m.isActive,
    })
    setEditMaterial(m)
  }

  const handleClose = () => {
    setCreateOpen(false)
    setEditMaterial(null)
    setDeleteConfirm(null)
  }

  const buildInput = (f: MaterialFormData) => ({
    name: f.name,
    description: f.description || undefined,
    sku: f.sku || undefined,
    unit: f.unit,
    unitCost: Number(f.unitCost),
    supplier: f.supplier || undefined,
    costCodeId: f.costCodeId || undefined,
    isActive: f.isActive,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createMaterial.mutateAsync(buildInput(form))
    handleClose()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMaterial) return
    await updateMaterial.mutateAsync({ id: editMaterial.id, ...buildInput(form) })
    handleClose()
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteMaterial.mutateAsync(deleteConfirm.id)
    handleClose()
  }

  const MaterialForm = ({ onSubmit, isPending, submitLabel }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Material name" required />
        </div>
        <div className="space-y-2">
          <Label>Unit *</Label>
          <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as MaterialUnit })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATERIAL_UNIT_LIST.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit Cost *</Label>
          <Input type="number" step="0.0001" min="0" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="0.00" required />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
        </div>
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Cost Code</Label>
          <Select value={form.costCodeId || 'NONE'} onValueChange={(v) => setForm({ ...form, costCodeId: v === 'NONE' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              {costCodes.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>{cc.code}{cc.description ? ` — ${cc.description}` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 col-span-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">Unit:</Label>
            <Select value={filterUnit} onValueChange={(v) => { setFilterUnit(v as MaterialUnit | 'ALL'); setPage(1) }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                {MATERIAL_UNIT_LIST.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-gray-600">Search:</Label>
            <Input className="w-56" placeholder="Name, SKU, or supplier..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate} size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Material
          </Button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No materials found.{' '}
                  {canWrite && (
                    <button onClick={handleOpenCreate} className="text-blue-600 hover:underline">Add the first one.</button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              materials.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-gray-900">{m.name}</TableCell>
                  <TableCell className="text-gray-600 font-mono text-sm">{m.sku ?? '-'}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell>${Number(m.unitCost).toFixed(2)}</TableCell>
                  <TableCell className="text-gray-600">{m.supplier ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={m.isActive ? 'success' : 'default'}>
                      {m.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPriceHistoryMaterial(m)} title="Price history">
                        <ChartBarIcon className="h-4 w-4 text-gray-500" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(m)}>
                            <PencilSquareIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(m)}>
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Material</DialogTitle></DialogHeader>
          <MaterialForm onSubmit={handleCreate} isPending={createMaterial.isPending} submitLabel="Create Material" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMaterial} onOpenChange={() => setEditMaterial(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Material</DialogTitle></DialogHeader>
          <MaterialForm onSubmit={handleUpdate} isPending={updateMaterial.isPending} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Material</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMaterial.isPending}>
              {deleteMaterial.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PriceHistoryDialog material={priceHistoryMaterial} onClose={() => setPriceHistoryMaterial(null)} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaterialsPage() {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const canWrite = WRITE_ROLES.some((r) => userRoles.includes(r))
  const canManage = MANAGE_ROLES.some((r) => userRoles.includes(r))

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Materials' },
          ]}
        />
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Material Database</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage materials and cost codes used in estimates and proposals.
        </p>
      </div>

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="cost-codes">Cost Codes</TabsTrigger>
        </TabsList>
        <TabsContent value="materials" className="mt-4">
          <MaterialsTab canWrite={canWrite} />
        </TabsContent>
        <TabsContent value="cost-codes" className="mt-4">
          <CostCodesTab canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
