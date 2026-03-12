'use client'

import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

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
} from '@promanage/ui-components'

import type { ContactType, ContactWithRelations, RoleName } from '@promanage/core'
import { CONTACT_TYPE_LIST, CONTACT_TYPES } from '@promanage/core'
import type { BadgeProps } from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
} from '@/hooks/use-contacts'

const TYPE_VARIANT: Record<ContactType, BadgeProps['variant']> = {
  CONTRACTOR: 'primary',
  CUSTOMER: 'success',
  VENDOR: 'warning',
  SUBCONTRACTOR: 'warning',
  EMPLOYEE: 'default',
  INSPECTOR: 'default',
  ARCHITECT: 'primary',
  ENGINEER: 'danger',
}

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']
const DELETE_ROLES: RoleName[] = ['Admin']

function ContactsTableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

interface ContactFormData {
  firstName: string
  lastName: string
  company: string
  type: ContactType
  email: string
  phone: string
  mobile: string
  title: string
  notes: string
}

const initialFormData: ContactFormData = {
  firstName: '',
  lastName: '',
  company: '',
  type: 'CONTRACTOR',
  email: '',
  phone: '',
  mobile: '',
  title: '',
  notes: '',
}

export default function ContactsPage() {
  const { user } = useAuth()
  const [filterType, setFilterType] = useState<ContactType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: contactsResult, isLoading } = useContacts({
    type: filterType !== 'ALL' ? filterType : undefined,
    search: debouncedSearch || undefined,
  })

  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()

  const [createOpen, setCreateOpen] = useState(false)
  const [editContact, setEditContact] = useState<ContactWithRelations | null>(null)
  const [deleteConfirmContact, setDeleteConfirmContact] = useState<ContactWithRelations | null>(null)
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)

  const contacts: ContactWithRelations[] = contactsResult?.data ?? []
  const userRoles = user?.roles ?? []
  const canWrite = WRITE_ROLES.some((r) => userRoles.includes(r))
  const canDelete = DELETE_ROLES.some((r) => userRoles.includes(r))

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleOpenCreate = () => {
    setFormData(initialFormData)
    setCreateOpen(true)
  }

  const handleOpenEdit = (contact: ContactWithRelations) => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company ?? '',
      type: contact.type,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
      title: contact.title ?? '',
      notes: contact.notes ?? '',
    })
    setEditContact(contact)
  }

  const handleCloseDialogs = () => {
    setCreateOpen(false)
    setEditContact(null)
    setDeleteConfirmContact(null)
    setFormData(initialFormData)
  }

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createContact.mutateAsync({
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company || undefined,
      type: formData.type,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      mobile: formData.mobile || undefined,
      title: formData.title || undefined,
      notes: formData.notes || undefined,
    })
    handleCloseDialogs()
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContact) return
    await updateContact.mutateAsync({
      id: editContact.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company || null,
      type: formData.type,
      email: formData.email || null,
      phone: formData.phone || null,
      mobile: formData.mobile || null,
      title: formData.title || null,
      notes: formData.notes || null,
    })
    handleCloseDialogs()
  }

  const handleDelete = async () => {
    if (!deleteConfirmContact) return
    await deleteContact.mutateAsync(deleteConfirmContact.id)
    handleCloseDialogs()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Contacts' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Contacts</h1>
        </div>
        {canWrite && (
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Contact
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="filter-type" className="text-sm text-gray-600">
            Type:
          </Label>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as ContactType | 'ALL')}
          >
            <SelectTrigger className="w-44" id="filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {CONTACT_TYPE_LIST.map((type) => (
                <SelectItem key={type} value={type}>
                  {CONTACT_TYPES[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="search" className="text-sm text-gray-600">
            Search:
          </Label>
          <Input
            id="search"
            className="w-64"
            placeholder="Name, company, or email..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <ContactsTableSkeleton />
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No contacts found.{' '}
                  {canWrite && (
                    <button
                      onClick={handleOpenCreate}
                      className="text-blue-600 hover:underline"
                    >
                      Add your first contact.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {contact.company ?? '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[contact.type]}>
                      {CONTACT_TYPES[contact.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {contact.email ?? '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {contact.phone ?? contact.mobile ?? '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(contact)}
                          title="Edit contact"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmContact(contact)}
                          title="Delete contact"
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as ContactType })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPE_LIST.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CONTACT_TYPES[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Job title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createContact.isPending}>
                {createContact.isPending ? 'Creating...' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as ContactType })}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPE_LIST.map((type) => (
                      <SelectItem key={type} value={type}>
                        {CONTACT_TYPES[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile</Label>
                <Input
                  id="edit-mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateContact.isPending}>
                {updateContact.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmContact} onOpenChange={() => setDeleteConfirmContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to delete &quot;{deleteConfirmContact?.firstName}{' '}
            {deleteConfirmContact?.lastName}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
