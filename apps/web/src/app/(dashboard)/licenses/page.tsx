'use client'

import {
  ArrowDownTrayIcon,
  BellIcon,
  DocumentArrowUpIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'

import {
  LICENSE_HOLDER_TYPE_LIST,
  LICENSE_STATUS_LIST,
  LICENSE_STATUSES,
  type LicenseHolderType,
  type LicenseStatus,
  type LicenseWithRelations,
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
  Textarea,
  type BadgeProps,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import {
  useCreateLicense,
  useCreateLicenseReminder,
  useDeleteLicense,
  useDeleteLicenseDocument,
  useDeleteLicenseReminder,
  useDownloadLicenseDocument,
  useLicense,
  useLicenses,
  useUpdateLicense,
  useUpdateLicenseReminder,
  useUploadLicenseDocument,
} from '@/hooks/use-licenses'
import { useUsers } from '@/hooks/use-users'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<LicenseStatus, BadgeProps['variant']> = {
  ACTIVE:    'success',
  EXPIRED:   'danger',
  PENDING:   'warning',
  SUSPENDED: 'warning',
  REVOKED:   'danger',
}

const WRITE_ROLES: RoleName[] = ['Admin', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin']
const REMINDER_ROLES: RoleName[] = ['Admin', 'OfficeAdmin', 'ProjectManager']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function expiryBadge(dateStr: string | null) {
  const days = daysUntil(dateStr)
  if (days === null) return null
  if (days < 0) return <Badge variant="danger">Expired</Badge>
  if (days <= 7) return <Badge variant="danger">{days}d left</Badge>
  if (days <= 30) return <Badge variant="warning">{days}d left</Badge>
  return null
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-44" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-8 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

interface LicenseFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: LicenseWithRelations | null
  users: { id: string; firstName: string; lastName: string }[]
}

function LicenseFormDialog({ open, onOpenChange, initial, users }: LicenseFormDialogProps) {
  const createLicense = useCreateLicense()
  const updateLicense = useUpdateLicense()

  const [name, setName] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [authority, setAuthority] = useState('')
  const [licenseType, setLicenseType] = useState('')
  const [holderType, setHolderType] = useState<LicenseHolderType>('ORGANIZATION')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState<LicenseStatus>('ACTIVE')
  const [startDate, setStartDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [renewalDate, setRenewalDate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setLicenseNumber(initial.licenseNumber ?? '')
      setAuthority(initial.authority ?? '')
      setLicenseType(initial.licenseType ?? '')
      setHolderType(initial.holderType as LicenseHolderType)
      setUserId(initial.userId ?? '')
      setStatus(initial.status as LicenseStatus)
      setStartDate(initial.startDate ? initial.startDate.slice(0, 10) : '')
      setExpirationDate(initial.expirationDate ? initial.expirationDate.slice(0, 10) : '')
      setRenewalDate(initial.renewalDate ? initial.renewalDate.slice(0, 10) : '')
      setNotes(initial.notes ?? '')
    } else {
      setName(''); setLicenseNumber(''); setAuthority(''); setLicenseType('')
      setHolderType('ORGANIZATION'); setUserId(''); setStatus('ACTIVE')
      setStartDate(''); setExpirationDate(''); setRenewalDate(''); setNotes('')
    }
  }, [initial, open])

  const toIso = (d: string) => d ? new Date(d).toISOString() : undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name,
      licenseNumber: licenseNumber || undefined,
      authority: authority || undefined,
      licenseType: licenseType || undefined,
      holderType,
      userId: holderType === 'USER' ? userId : undefined,
      status,
      startDate: toIso(startDate),
      expirationDate: toIso(expirationDate),
      renewalDate: toIso(renewalDate),
      notes: notes || undefined,
    }
    if (initial) {
      await updateLicense.mutateAsync({ id: initial.id, ...payload })
    } else {
      await createLicense.mutateAsync(payload)
    }
    onOpenChange(false)
  }

  const isPending = createLicense.isPending || updateLicense.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit License' : 'Add License'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="lic-name">Name *</Label>
              <Input id="lic-name" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="lic-num">License Number</Label>
              <Input id="lic-num" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lic-type">License Type</Label>
              <Input id="lic-type" value={licenseType} onChange={e => setLicenseType(e.target.value)} placeholder="e.g. General Contractor" />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="lic-auth">Issuing Authority</Label>
              <Input id="lic-auth" value={authority} onChange={e => setAuthority(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Holder</Label>
              <Select value={holderType} onValueChange={v => setHolderType(v as LicenseHolderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENSE_HOLDER_TYPE_LIST.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {holderType === 'USER' && (
              <div className="space-y-1">
                <Label>License Holder</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as LicenseStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LICENSE_STATUS_LIST.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lic-start">Start Date</Label>
              <Input id="lic-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lic-exp">Expiration Date</Label>
              <Input id="lic-exp" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lic-renew">Renewal Date</Label>
              <Input id="lic-renew" type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="lic-notes">Notes</Label>
              <Textarea id="lic-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : (initial ? 'Save Changes' : 'Add License')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Documents Panel ──────────────────────────────────────────────────────────

function DocumentsPanel({ license, canWrite }: { license: LicenseWithRelations; canWrite: boolean }) {
  const uploadDoc = useUploadLicenseDocument()
  const downloadDoc = useDownloadLicenseDocument()
  const deleteDoc = useDeleteLicenseDocument()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tag, setTag] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadDoc.mutateAsync({ licenseId: license.id, file, documentTag: tag || undefined })
    setTag('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Documents ({license.documents.length})</h4>
      {license.documents.length > 0 && (
        <ul className="space-y-2">
          {license.documents.map(doc => (
            <li key={doc.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
              <span className="truncate max-w-[200px]" title={doc.fileName}>
                {doc.documentTag ? <><span className="font-medium">{doc.documentTag}</span> — </> : ''}
                {doc.fileName}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDoc.mutate({ licenseId: license.id, docId: doc.id })}
                  disabled={downloadDoc.isPending}
                  title="Download"
                  aria-label="Download document"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                </Button>
                {canWrite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDoc.mutate({ licenseId: license.id, docId: doc.id })}
                    disabled={deleteDoc.isPending}
                    title="Delete"
                    aria-label="Delete document"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="doc-tag" className="text-xs">Label (optional)</Label>
            <Input id="doc-tag" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. 2025 Application" className="h-8 text-sm" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadDoc.isPending}
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
            {uploadDoc.isPending ? 'Uploading…' : 'Upload'}
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
        </div>
      )}
    </div>
  )
}

// ─── Reminders Panel ──────────────────────────────────────────────────────────

function RemindersPanel({
  license,
  canManage,
  users,
}: {
  license: LicenseWithRelations
  canManage: boolean
  users: { id: string; firstName: string; lastName: string }[]
}) {
  const createReminder = useCreateLicenseReminder()
  const updateReminder = useUpdateLicenseReminder()
  const deleteReminder = useDeleteLicenseReminder()
  const [days, setDays] = useState('30')
  const [notifyId, setNotifyId] = useState('')
  const [supervisorId, setSupervisorId] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await createReminder.mutateAsync({
      licenseId: license.id,
      daysBeforeExpiration: parseInt(days, 10),
      notifyUserId: notifyId,
      notifySupervisorId: supervisorId && supervisorId !== 'none' ? supervisorId : undefined,
    })
    setDays('30'); setNotifyId(''); setSupervisorId('')
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Reminders ({license.reminders.length})</h4>
      <p className="text-xs text-gray-500">
        Reminders ≤7 days fire daily. Reminders &gt;7 days fire once per expiration cycle.
        Updating the expiration date resets all reminder cycles.
      </p>

      {license.reminders.length > 0 && (
        <ul className="space-y-2">
          {license.reminders.map(r => (
            <li key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
              <span>
                <span className="font-medium">{r.daysBeforeExpiration}d</span> before — notify{' '}
                <span className="font-medium">{r.notifyUser.firstName} {r.notifyUser.lastName}</span>
                {r.notifySupervisor && <> + {r.notifySupervisor.firstName} {r.notifySupervisor.lastName}</>}
              </span>
              <div className="flex items-center gap-1">
                <Badge variant={r.isActive ? 'success' : 'default'}>{r.isActive ? 'On' : 'Off'}</Badge>
                {canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateReminder.mutate({ licenseId: license.id, reminderId: r.id, isActive: !r.isActive })}
                    >
                      {r.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder.mutate({ licenseId: license.id, reminderId: r.id })}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="r-days" className="text-xs">Days before expiry</Label>
            <Input id="r-days" type="number" min={1} max={365} value={days} onChange={e => setDays(e.target.value)} className="h-8 text-sm" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notify</Label>
            <Select value={notifyId} onValueChange={setNotifyId} required>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Also notify supervisor (optional)</Label>
            <Select value={supervisorId} onValueChange={setSupervisorId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end">
            <Button type="submit" size="sm" disabled={createReminder.isPending || !notifyId}>
              <BellIcon className="h-4 w-4 mr-1" />
              {createReminder.isPending ? 'Adding…' : 'Add Reminder'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function LicenseDetailDialog({
  licenseId,
  open,
  onOpenChange,
  canWrite,
  canManageReminders,
  users,
}: {
  licenseId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  canWrite: boolean
  canManageReminders: boolean
  users: { id: string; firstName: string; lastName: string }[]
}) {
  const { data: license, isLoading } = useLicense(licenseId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{license?.name ?? 'License Detail'}</DialogTitle>
        </DialogHeader>
        {isLoading || !license ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><span className="font-medium text-gray-500">Number:</span> {license.licenseNumber ?? '—'}</div>
              <div><span className="font-medium text-gray-500">Type:</span> {license.licenseType ?? '—'}</div>
              <div><span className="font-medium text-gray-500">Authority:</span> {license.authority ?? '—'}</div>
              <div><span className="font-medium text-gray-500">Holder:</span> {license.holderType === 'USER' ? (license.user ? `${license.user.firstName} ${license.user.lastName}` : '—') : 'Organization'}</div>
              <div><span className="font-medium text-gray-500">Start:</span> {license.startDate ? new Date(license.startDate).toLocaleDateString() : '—'}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">Expires:</span>
                {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : '—'}
                {expiryBadge(license.expirationDate)}
              </div>
              {license.notes && <div className="col-span-2"><span className="font-medium text-gray-500">Notes:</span> {license.notes}</div>}
            </div>

            <hr />
            <DocumentsPanel license={license} canWrite={canWrite} />
            <hr />
            <RemindersPanel license={license} canManage={canManageReminders} users={users} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  license,
  open,
  onOpenChange,
}: {
  license: LicenseWithRelations | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const deleteLicense = useDeleteLicense()

  async function handleConfirm() {
    if (!license) return
    await deleteLicense.mutateAsync(license.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete License</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 py-2">
          Are you sure you want to delete <strong>{license?.name}</strong>? This will also delete all associated documents and reminders.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="danger" onClick={handleConfirm} disabled={deleteLicense.isPending}>
            {deleteLicense.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LicensesPage() {
  const { user } = useAuth()
  const userRoles = (user?.roles ?? []) as RoleName[]
  const canWrite = WRITE_ROLES.some(r => userRoles.includes(r))
  const canDelete = DELETE_ROLES.some(r => userRoles.includes(r))
  const canManageReminders = REMINDER_ROLES.some(r => userRoles.includes(r))

  const [search, setSearch] = useState('')
  const [holderFilter, setHolderFilter] = useState<LicenseHolderType | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'ALL'>('ALL')

  const { data, isLoading } = useLicenses({
    search: search || undefined,
    holderType: holderFilter !== 'ALL' ? holderFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  })

  const { data: usersData } = useUsers()
  const users = usersData?.data ?? []

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LicenseWithRelations | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LicenseWithRelations | null>(null)

  const licenses = data?.data ?? []

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Licenses' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track organization and individual licenses with renewal reminders</p>
        </div>
        {canWrite && (
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add License
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search name, number, authority…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={holderFilter} onValueChange={v => setHolderFilter(v as LicenseHolderType | 'ALL')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Holders</SelectItem>
            {LICENSE_HOLDER_TYPE_LIST.map(h => (
              <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as LicenseStatus | 'ALL')}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {LICENSE_STATUS_LIST.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Holder</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : licenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No licenses found. {canWrite && 'Add your first license to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              licenses.map(license => (
                <TableRow
                  key={license.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setDetailId(license.id)}
                >
                  <TableCell className="font-medium">
                    <div>{license.name}</div>
                    {license.licenseNumber && <div className="text-xs text-gray-500">{license.licenseNumber}</div>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{license.licenseType ?? '—'}</TableCell>
                  <TableCell>
                    {license.holderType === 'ORGANIZATION'
                      ? <Badge variant="default">Organization</Badge>
                      : <Badge variant="primary">{license.user ? `${license.user.firstName} ${license.user.lastName}` : 'Individual'}</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[license.status as LicenseStatus]}>
                      {LICENSE_STATUSES[license.status as LicenseStatus]?.label ?? license.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      {license.expirationDate ? new Date(license.expirationDate).toLocaleDateString() : '—'}
                      {expiryBadge(license.expirationDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {license.documents.length > 0 ? `${license.documents.length} file${license.documents.length === 1 ? '' : 's'}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditTarget(license); setFormOpen(true) }}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setDeleteTarget(license) }}
                        >
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

      {/* Dialogs */}
      <LicenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        users={users}
      />

      {detailId && (
        <LicenseDetailDialog
          licenseId={detailId}
          open={Boolean(detailId)}
          onOpenChange={open => { if (!open) setDetailId(null) }}
          canWrite={canWrite}
          canManageReminders={canManageReminders}
          users={users}
        />
      )}

      <DeleteConfirmDialog
        license={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
      />
    </div>
  )
}
