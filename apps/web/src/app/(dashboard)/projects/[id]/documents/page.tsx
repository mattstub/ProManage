'use client'

import { DocumentTextIcon, FolderOpenIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { use, useState } from 'react'

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
} from '@promanage/ui-components'

import type { DrawingSheetWithRevision, SpecificationSectionWithRevision } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import {
  useCreateDrawingSheet,
  useCreateSpecSection,
  useDeleteDrawingSheet,
  useDeleteSpecSection,
  useDrawingDisciplines,
  useDrawingSheets,
  useSpecSections,
} from '@/hooks/use-construction-documents'


// ─── Drawing Log Tab ──────────────────────────────────────────────────────────

function DrawingLog({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const isManager = user?.roles?.some((r) => ['Admin', 'ProjectManager'].includes(r))

  const { data: sheets, isLoading } = useDrawingSheets(projectId)
  const { data: disciplines } = useDrawingDisciplines()
  const createSheet = useCreateDrawingSheet(projectId)
  const deleteSheet = useDeleteDrawingSheet(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ sheetNumber: '', title: '', disciplineId: '' })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createSheet.mutate(
      {
        sheetNumber: form.sheetNumber,
        title: form.title,
        disciplineId: form.disciplineId || null,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setForm({ sheetNumber: '', title: '', disciplineId: '' })
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {sheets?.length ?? 0} sheet{sheets?.length !== 1 ? 's' : ''}
        </p>
        {isManager && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Sheet
          </Button>
        )}
      </div>

      {!sheets?.length ? (
        <div className="text-center py-12 text-gray-500">
          <FolderOpenIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium">No drawing sheets yet</p>
          <p className="text-xs text-gray-400 mt-1">Add sheets to start tracking the drawing log</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Sheet #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Discipline
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Revision
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Rev Date
                </th>
                {isManager && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sheets.map((sheet: DrawingSheetWithRevision) => (
                <tr key={sheet.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                    {sheet.sheetNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{sheet.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sheet.discipline ? (
                      <span className="inline-flex items-center gap-1.5">
                        {sheet.discipline.abbreviation && (
                          <Badge variant="default" className="text-xs px-1.5">
                            {sheet.discipline.abbreviation}
                          </Badge>
                        )}
                        <span className="text-xs">{sheet.discipline.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {sheet.currentRevision ? (
                      <Badge variant="outline" className="font-mono text-xs">
                        Rev {sheet.currentRevision.revisionNumber}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">No revision</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {sheet.currentRevision?.revisionDate
                      ? new Date(sheet.currentRevision.revisionDate).toLocaleDateString()
                      : '—'}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSheet.mutate(sheet.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Drawing Sheet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sheetNumber">Sheet Number *</Label>
                <Input
                  id="sheetNumber"
                  placeholder="A-101"
                  value={form.sheetNumber}
                  onChange={(e) => setForm((f) => ({ ...f, sheetNumber: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="discipline">Discipline</Label>
                <Select
                  value={form.disciplineId}
                  onValueChange={(v) => setForm((f) => ({ ...f, disciplineId: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger id="discipline">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No discipline</SelectItem>
                    {disciplines?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.abbreviation ? `${d.abbreviation} — ` : ''}{d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Sheet Title *</Label>
              <Input
                id="title"
                placeholder="Floor Plan — Level 1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createSheet.isPending}>
                {createSheet.isPending ? 'Adding…' : 'Add Sheet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Specifications Tab ───────────────────────────────────────────────────────

function SpecificationsLog({ projectId }: { projectId: string }) {
  const { user } = useAuth()
  const isManager = user?.roles?.some((r) => ['Admin', 'ProjectManager'].includes(r))

  const { data: sections, isLoading } = useSpecSections(projectId)
  const createSection = useCreateSpecSection(projectId)
  const deleteSection = useDeleteSpecSection(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ sectionNumber: '', title: '', description: '' })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createSection.mutate(
      {
        sectionNumber: form.sectionNumber,
        title: form.title,
        description: form.description || null,
      },
      {
        onSuccess: () => {
          setCreateOpen(false)
          setForm({ sectionNumber: '', title: '', description: '' })
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {sections?.length ?? 0} section{sections?.length !== 1 ? 's' : ''}
        </p>
        {isManager && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Section
          </Button>
        )}
      </div>

      {!sections?.length ? (
        <div className="text-center py-12 text-gray-500">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium">No specification sections yet</p>
          <p className="text-xs text-gray-400 mt-1">Add sections to track the specification set</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  Section #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Rev
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Status
                </th>
                {isManager && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sections.map((section: SpecificationSectionWithRevision) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">
                    {section.sectionNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{section.title}</div>
                    {section.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {section.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {section.currentRevision ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        v{section.currentRevision.revisionNumber}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {section.currentRevision?.isAmendment ? (
                      <Badge variant="default" className="text-xs">Conformed</Badge>
                    ) : section.currentRevision ? (
                      <Badge variant="outline" className="text-xs">Original</Badge>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  {isManager && (
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSection.mutate(section.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete section"
                        title="Delete section"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Specification Section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="sectionNumber">Section Number *</Label>
              <Input
                id="sectionNumber"
                placeholder="03 00 00"
                value={form.sectionNumber}
                onChange={(e) => setForm((f) => ({ ...f, sectionNumber: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-400">Freeform — use any numbering convention</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specTitle">Title *</Label>
              <Input
                id="specTitle"
                placeholder="Cast-In-Place Concrete"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specDesc">Description</Label>
              <Input
                id="specDesc"
                placeholder="Optional notes"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createSection.isPending}>
                {createSection.isPending ? 'Adding…' : 'Add Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: projectId } = use(params)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Construction Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Drawing log and specification set — version history tracked per sheet and section
        </p>
      </div>

      <Tabs defaultValue="drawings">
        <TabsList>
          <TabsTrigger value="drawings">Drawing Log</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
        </TabsList>

        <TabsContent value="drawings" className="mt-4">
          <DrawingLog projectId={projectId} />
        </TabsContent>

        <TabsContent value="specs" className="mt-4">
          <SpecificationsLog projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
