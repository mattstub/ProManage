'use client'

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

import {
  PROPOSAL_STATUS_LIST,
  PROPOSAL_STATUSES,
  type ProposalStatus,
  type ProposalTemplate,
  type ProposalWithRelations,
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
  Switch,
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
  useCreateProposal,
  useCreateProposalTemplate,
  useDeleteProposal,
  useDeleteProposalTemplate,
  useProposalTemplates,
  useProposals,
  useUpdateProposal,
  useUpdateProposalTemplate,
} from '@/hooks/use-proposals'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const ADMIN_ROLES: RoleName[] = ['Admin']

const STATUS_VARIANT: Record<ProposalStatus, BadgeProps['variant']> = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  REVISED: 'warning',
}

// ─── Proposals Tab ────────────────────────────────────────────────────────────

function ProposalsTab({ canWrite, canAdminDelete }: { canWrite: boolean; canAdminDelete: boolean }) {
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL')
  const { data: proposals = [], isLoading } = useProposals({
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
  })
  const { data: templates = [] } = useProposalTemplates(true)
  const createProposal = useCreateProposal()
  const updateProposal = useUpdateProposal()
  const deleteProposal = useDeleteProposal()

  const [createOpen, setCreateOpen] = useState(false)
  const [editProposal, setEditProposal] = useState<ProposalWithRelations | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ProposalWithRelations | null>(null)
  const [form, setForm] = useState({
    title: '',
    status: 'DRAFT' as ProposalStatus,
    coverLetter: '',
    terms: '',
    templateId: '',
  })

  const handleOpenCreate = () => {
    setForm({ title: '', status: 'DRAFT', coverLetter: '', terms: '', templateId: '' })
    setCreateOpen(true)
  }

  const handleOpenEdit = (p: ProposalWithRelations) => {
    setForm({
      title: p.title,
      status: p.status as ProposalStatus,
      coverLetter: p.coverLetter ?? '',
      terms: p.terms ?? '',
      templateId: '',
    })
    setEditProposal(p)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProposal.mutateAsync({
      title: form.title,
      coverLetter: form.coverLetter || undefined,
      terms: form.terms || undefined,
      templateId: form.templateId || undefined,
    })
    setCreateOpen(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProposal) return
    await updateProposal.mutateAsync({
      id: editProposal.id,
      title: form.title,
      status: form.status,
      coverLetter: form.coverLetter || null,
      terms: form.terms || null,
    })
    setEditProposal(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteProposal.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-gray-600">Status:</Label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ProposalStatus | 'ALL')}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {PROPOSAL_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{PROPOSAL_STATUSES[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canWrite && (
          <Button size="sm" onClick={handleOpenCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Proposal
          </Button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No proposals.{' '}
                  {canWrite && <button onClick={handleOpenCreate} className="text-blue-600 hover:underline">Create one.</button>}
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm text-gray-500">#{p.proposalNumber}</TableCell>
                  <TableCell className="font-medium text-gray-900">{p.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status as ProposalStatus]}>
                      {PROPOSAL_STATUSES[p.status as ProposalStatus]?.label ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {p.customer ? `${p.customer.firstName} ${p.customer.lastName}` : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {p.project?.name ?? '-'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {p.validUntil ? new Date(p.validUntil).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(p)}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canAdminDelete && (
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(p)}>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Office Building Bid" required />
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={form.templateId || 'NONE'} onValueChange={(v) => setForm({ ...form, templateId: v === 'NONE' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Cover Letter</Label>
              <Textarea value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} rows={3} placeholder="Thank you for the opportunity..." />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} placeholder="Payment due net 30." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={createProposal.isPending}>
                {createProposal.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProposal} onOpenChange={() => setEditProposal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Proposal</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProposalStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPOSAL_STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{PROPOSAL_STATUSES[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cover Letter</Label>
              <Textarea value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Terms</Label>
              <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={updateProposal.isPending}>
                {updateProposal.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Proposal</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Delete &quot;{deleteConfirm?.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteProposal.isPending}>
              {deleteProposal.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab({ canManage }: { canManage: boolean }) {
  const { data: templates = [], isLoading } = useProposalTemplates()
  const createTemplate = useCreateProposalTemplate()
  const updateTemplate = useUpdateProposalTemplate()
  const deleteTemplate = useDeleteProposalTemplate()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<ProposalTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ProposalTemplate | null>(null)
  const [form, setForm] = useState({ name: '', description: '', coverLetter: '', terms: '', isActive: true })

  const handleOpenCreate = () => {
    setForm({ name: '', description: '', coverLetter: '', terms: '', isActive: true })
    setCreateOpen(true)
  }

  const handleOpenEdit = (t: ProposalTemplate) => {
    setForm({
      name: t.name,
      description: t.description ?? '',
      coverLetter: t.coverLetter ?? '',
      terms: t.terms ?? '',
      isActive: t.isActive,
    })
    setEditTemplate(t)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTemplate.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      coverLetter: form.coverLetter || undefined,
      terms: form.terms || undefined,
    })
    setCreateOpen(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTemplate) return
    await updateTemplate.mutateAsync({
      id: editTemplate.id,
      name: form.name,
      description: form.description || null,
      coverLetter: form.coverLetter || null,
      terms: form.terms || null,
      isActive: form.isActive,
    })
    setEditTemplate(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteTemplate.mutateAsync(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const TemplateForm = ({ onSubmit, isPending, submitLabel }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard Proposal" required />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Cover Letter</Label>
        <Textarea value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Terms</Label>
        <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} />
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="tmpl-active"
          checked={form.isActive}
          onCheckedChange={(v) => setForm({ ...form, isActive: v })}
        />
        <Label htmlFor="tmpl-active">Active</Label>
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
          <Button size="sm" onClick={handleOpenCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(4)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No templates.{' '}
                  {canManage && <button onClick={handleOpenCreate} className="text-blue-600 hover:underline">Create one.</button>}
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-gray-900">{t.name}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{t.description ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={t.isActive ? 'success' : 'default'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(t)}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(t)}>
                          <TrashIcon className="h-4 w-4 text-red-500" />
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <TemplateForm onSubmit={handleCreate} isPending={createTemplate.isPending} submitLabel="Create" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          <TemplateForm onSubmit={handleUpdate} isPending={updateTemplate.isPending} submitLabel="Save" />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Template</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-4">Delete &quot;{deleteConfirm?.name}&quot;?</p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteTemplate.isPending}>
              {deleteTemplate.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const canWrite = WRITE_ROLES.some((r) => userRoles.includes(r))
  const canAdminDelete = ADMIN_ROLES.some((r) => userRoles.includes(r))

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Proposals' },
          ]}
        />
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Proposals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage client proposals and reusable templates.</p>
      </div>

      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="proposals" className="mt-4">
          <ProposalsTab canWrite={canWrite} canAdminDelete={canAdminDelete} />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab canManage={canAdminDelete} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
