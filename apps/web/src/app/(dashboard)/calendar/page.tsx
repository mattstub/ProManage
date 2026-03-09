'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

import { EVENT_TYPE_LIST, EVENT_TYPES } from '@promanage/core'
import {
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
  Textarea,
} from '@promanage/ui-components'

import type { CalendarEventWithRelations, EventType, RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useDeleteCalendarEvent,
  useUpdateCalendarEvent,
} from '@/hooks/use-calendar-events'
import { useProjects } from '@/hooks/use-projects'

// ── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CREATE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin', 'Superintendent']

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  MEETING: 'bg-blue-500',
  MILESTONE: 'bg-purple-500',
  INSPECTION: 'bg-orange-500',
  DEADLINE: 'bg-red-500',
  OTHER: 'bg-gray-500',
}

const EVENT_TYPE_BADGE_COLORS: Record<EventType, string> = {
  MEETING: 'bg-blue-100 text-blue-800',
  MILESTONE: 'bg-purple-100 text-purple-800',
  INSPECTION: 'bg-orange-100 text-orange-800',
  DEADLINE: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-800',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const endPad = 6 - lastDay.getDay()

  const days: Date[] = []
  for (let i = startPad; i > 0; i--) {
    days.push(new Date(year, month, 1 - i))
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i))
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function eventsForDay(events: CalendarEventWithRelations[], day: Date): CalendarEventWithRelations[] {
  return events.filter((e) => isSameDay(new Date(e.startDate), day))
}

// ── Form State ────────────────────────────────────────────────────────────────

interface EventFormData {
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  eventType: EventType
  projectId: string
}

function initialForm(date?: Date): EventFormData {
  const d = date ? toInputDate(date) : toInputDate(new Date())
  return {
    title: '',
    description: '',
    startDate: d,
    endDate: d,
    allDay: true,
    eventType: 'OTHER',
    projectId: '',
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EventPill({
  event,
  onClick,
}: {
  event: CalendarEventWithRelations
  onClick: (e: CalendarEventWithRelations) => void
}) {
  return (
    <button
      onClick={(ev) => { ev.stopPropagation(); onClick(event) }}
      className={`w-full text-left text-xs text-white rounded px-1 py-0.5 truncate ${EVENT_TYPE_COLORS[event.eventType as EventType]}`}
      title={event.title}
    >
      {event.title}
    </button>
  )
}

// ── Day Detail Dialog ─────────────────────────────────────────────────────────

interface DayDetailProps {
  day: Date | null
  events: CalendarEventWithRelations[]
  canCreate: boolean
  onClose: () => void
  onEdit: (event: CalendarEventWithRelations) => void
  onDelete: (event: CalendarEventWithRelations) => void
  onCreateForDay: (day: Date) => void
  currentUserId?: string
  isAdmin: boolean
}

function DayDetailDialog({
  day,
  events,
  canCreate,
  onClose,
  onEdit,
  onDelete,
  onCreateForDay,
  currentUserId,
  isAdmin,
}: DayDetailProps) {
  if (!day) return null
  const dayEvents = eventsForDay(events, day)

  const canEditEvent = (event: CalendarEventWithRelations) =>
    isAdmin || event.createdById === currentUserId || canCreate

  const canDeleteEvent = (event: CalendarEventWithRelations) =>
    isAdmin || event.createdById === currentUserId

  return (
    <Dialog open={!!day} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatDate(day)}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {dayEvents.length === 0 ? (
            <p className="text-sm text-gray-500">No events scheduled.</p>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between gap-2 p-3 rounded-lg border border-gray-200"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <div
                    className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${EVENT_TYPE_COLORS[event.eventType as EventType]}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${EVENT_TYPE_BADGE_COLORS[event.eventType as EventType]}`}
                      >
                        {EVENT_TYPES[event.eventType as EventType].label}
                      </span>
                      {event.project && (
                        <span className="text-xs text-gray-500">
                          #{event.project.number} {event.project.name}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canEditEvent(event) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { onClose(); onEdit(event) }}
                      title="Edit event"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteEvent(event) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { onClose(); onDelete(event) }}
                      title="Delete event"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-center pt-4">
          {canCreate && (
            <Button
              size="sm"
              onClick={() => { onClose(); onCreateForDay(day) }}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Event
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Event Form Dialog ──────────────────────────────────────────────────────────

interface EventFormDialogProps {
  open: boolean
  title: string
  formData: EventFormData
  projects: { id: string; name: string; number: string }[]
  isPending: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onChange: (data: EventFormData) => void
  submitLabel: string
}

function EventFormDialog({
  open,
  title,
  formData,
  projects,
  isPending,
  onClose,
  onSubmit,
  onChange,
  submitLabel,
}: EventFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Title *</Label>
            <Input
              id="event-title"
              value={formData.title}
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
              placeholder="Event title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select
              value={formData.eventType}
              onValueChange={(v) => onChange({ ...formData, eventType: v as EventType })}
            >
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_LIST.map((type) => (
                  <SelectItem key={type} value={type}>
                    {EVENT_TYPES[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-start">Start Date *</Label>
              <Input
                id="event-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">End Date *</Label>
              <Input
                id="event-end"
                type="date"
                value={formData.endDate}
                min={formData.startDate}
                onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-project">Project</Label>
            <Select
              value={formData.projectId || 'none'}
              onValueChange={(v) => onChange({ ...formData, projectId: v === 'none' ? '' : v })}
            >
              <SelectTrigger id="event-project">
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const { user } = useAuth()
  const { data: eventsResult, isLoading } = useCalendarEvents(year, month)
  const { data: projectsResult } = useProjects()

  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()

  const events: CalendarEventWithRelations[] = eventsResult?.data ?? []
  const projects = projectsResult?.data ?? []

  const userRoles = user?.roles ?? []
  const canCreate = CREATE_ROLES.some((r) => userRoles.includes(r))
  const isAdmin = userRoles.includes('Admin')

  // Dialog state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEventWithRelations | null>(null)
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<CalendarEventWithRelations | null>(null)
  const [formData, setFormData] = useState<EventFormData>(initialForm())

  const grid = getMonthGrid(year, month)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  function handleDayClick(day: Date) {
    if (day.getMonth() !== month) return
    setSelectedDay(day)
  }

  function handleOpenCreate(day?: Date) {
    setFormData(initialForm(day))
    setCreateOpen(true)
  }

  function handleOpenEdit(event: CalendarEventWithRelations) {
    setFormData({
      title: event.title,
      description: event.description ?? '',
      startDate: toInputDate(new Date(event.startDate)),
      endDate: toInputDate(new Date(event.endDate)),
      allDay: event.allDay,
      eventType: event.eventType as EventType,
      projectId: event.projectId ?? '',
    })
    setEditEvent(event)
  }

  function handleCloseDialogs() {
    setCreateOpen(false)
    setEditEvent(null)
    setDeleteConfirmEvent(null)
    setFormData(initialForm())
  }

  async function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault()
    await createEvent.mutateAsync({
      title: formData.title,
      description: formData.description || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      allDay: formData.allDay,
      eventType: formData.eventType,
      projectId: formData.projectId || undefined,
    })
    handleCloseDialogs()
  }

  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editEvent) return
    await updateEvent.mutateAsync({
      id: editEvent.id,
      title: formData.title,
      description: formData.description || null,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      allDay: formData.allDay,
      eventType: formData.eventType,
      projectId: formData.projectId || null,
    })
    handleCloseDialogs()
  }

  async function handleDelete() {
    if (!deleteConfirmEvent) return
    await deleteEvent.mutateAsync(deleteConfirmEvent.id)
    handleCloseDialogs()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Calendar' },
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Calendar</h1>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenCreate()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Event
          </Button>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 w-44 text-center">
              {MONTH_NAMES[month]} {year}
            </h2>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month
            const todayCell = isToday(day)
            const dayEvents = eventsForDay(events, day)
            const overflowCount = Math.max(0, dayEvents.length - 3)
            const visibleEvents = dayEvents.slice(0, 3)

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={[
                  'min-h-[96px] border-b border-r border-gray-100 p-1.5 transition-colors',
                  isCurrentMonth
                    ? 'bg-white cursor-pointer hover:bg-gray-50'
                    : 'bg-gray-50 cursor-default',
                  idx % 7 === 6 ? 'border-r-0' : '',
                ].join(' ')}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={[
                      'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                      todayCell
                        ? 'bg-blue-600 text-white'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                  {isLoading && isCurrentMonth && (
                    <Skeleton className="h-3 w-3 rounded" />
                  )}
                </div>

                {/* Events */}
                {isLoading && isCurrentMonth ? (
                  <div className="space-y-0.5">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-4 w-full rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => (
                      <EventPill key={event.id} event={event} onClick={handleOpenEdit} />
                    ))}
                    {overflowCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDay(day) }}
                        className="text-xs text-gray-500 hover:text-gray-700 pl-1"
                      >
                        +{overflowCount} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-4 flex-wrap">
          {EVENT_TYPE_LIST.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${EVENT_TYPE_COLORS[type]}`} />
              <span className="text-xs text-gray-600">{EVENT_TYPES[type].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        day={selectedDay}
        events={events}
        canCreate={canCreate}
        onClose={() => setSelectedDay(null)}
        onEdit={handleOpenEdit}
        onDelete={setDeleteConfirmEvent}
        onCreateForDay={handleOpenCreate}
        currentUserId={user?.id}
        isAdmin={isAdmin}
      />

      {/* Create Event Dialog */}
      <EventFormDialog
        open={createOpen}
        title="New Event"
        formData={formData}
        projects={projects}
        isPending={createEvent.isPending}
        onClose={handleCloseDialogs}
        onSubmit={handleSubmitCreate}
        onChange={setFormData}
        submitLabel="Create Event"
      />

      {/* Edit Event Dialog */}
      <EventFormDialog
        open={!!editEvent}
        title="Edit Event"
        formData={formData}
        projects={projects}
        isPending={updateEvent.isPending}
        onClose={handleCloseDialogs}
        onSubmit={handleSubmitEdit}
        onChange={setFormData}
        submitLabel="Save Changes"
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmEvent} onOpenChange={() => setDeleteConfirmEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to delete &quot;{deleteConfirmEvent?.title}&quot;? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button variant="danger" onClick={handleDelete} disabled={deleteEvent.isPending}>
              {deleteEvent.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
