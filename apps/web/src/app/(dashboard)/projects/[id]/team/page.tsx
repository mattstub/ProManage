'use client'

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { use, useState } from 'react'

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@promanage/ui-components'

import type { RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import { useContacts } from '@/hooks/use-contacts'
import { useAssignContact, useProjectContacts, useRemoveProjectContact } from '@/hooks/use-projects'

const WRITE_ROLES: RoleName[] = ['Admin', 'ProjectManager']

function AssignContactDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const assignContact = useAssignContact()
  const { data: contactsResult } = useContacts()
  const contacts = contactsResult?.data ?? []
  const [contactId, setContactId] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId) return
    setError(null)
    try {
      await assignContact.mutateAsync({
        projectId,
        contactId,
        input: { role: role || undefined },
      })
      onOpenChange(false)
      setContactId('')
      setRole('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign contact'
      setError(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="contact-select">Contact *</Label>
            <select
              id="contact-select"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
            >
              <option value="">Select contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="contact-role">Role on Project</Label>
            <Input
              id="contact-role"
              placeholder="e.g. Electrician, PM, Inspector"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={assignContact.isPending}>
              {assignContact.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { data: contacts, isLoading } = useProjectContacts(id)
  const removeContact = useRemoveProjectContact()
  const [assignOpen, setAssignOpen] = useState(false)

  const canManage = WRITE_ROLES.some((r) => user?.roles.includes(r))

  async function handleRemove(contactId: string) {
    await removeContact.mutateAsync({ projectId: id, contactId })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Project Team</h2>
        {canManage && (
          <button
            onClick={() => setAssignOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Assign Member
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role on Project</TableHead>
              <TableHead>Assigned</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(canManage ? 6 : 5)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ) : (contacts?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="text-center text-gray-500 py-8">
                  No team members assigned.{' '}
                  {canManage && (
                    <button onClick={() => setAssignOpen(true)} className="text-blue-600 hover:underline">
                      Assign the first member.
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              contacts?.map((assignment) => (
                <TableRow key={assignment.contact.id}>
                  <TableCell className="font-medium text-gray-900">
                    {assignment.contact.firstName} {assignment.contact.lastName}
                  </TableCell>
                  <TableCell className="text-gray-600">{assignment.contact.company ?? '—'}</TableCell>
                  <TableCell className="text-gray-600">{assignment.contact.type}</TableCell>
                  <TableCell className="text-gray-600">{assignment.role ?? '—'}</TableCell>
                  <TableCell className="text-gray-600">
                    {assignment.assignedAt
                      ? new Date(assignment.assignedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <button
                        onClick={() => handleRemove(assignment.contact.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssignContactDialog
        projectId={id}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </div>
  )
}
