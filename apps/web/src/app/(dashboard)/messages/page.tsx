'use client'

import {
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@promanage/ui-components'

import type { AnnouncementWithRelations, ConversationWithRelations, RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import {
  useAnnouncements,
  useConversationMessages,
  useConversations,
  useCreateAnnouncement,
  useDeleteAnnouncement,
  useDraftAnnouncements,
  useMarkAnnouncementRead,
  useMarkConversationRead,
  useSendMessage,
  useStartConversation,
} from '@/hooks/use-messaging'
import { useUsers } from '@/hooks/use-users'

const ANNOUNCE_ROLES: RoleName[] = ['Admin', 'ProjectManager', 'OfficeAdmin']

const ROLE_OPTIONS = [
  { value: 'ALL', label: 'All Users' },
  { value: 'Admin', label: 'Administrators' },
  { value: 'ProjectManager', label: 'Project Managers' },
  { value: 'Superintendent', label: 'Superintendents' },
  { value: 'Foreman', label: 'Foremen' },
  { value: 'FieldUser', label: 'Field Users' },
  { value: 'OfficeAdmin', label: 'Office Admins' },
]

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Conversation Thread Panel ────────────────────────────────────────────────

function ThreadPanel({
  conversation,
  currentUserId,
}: {
  conversation: ConversationWithRelations
  currentUserId: string
}) {
  const queryClient = useQueryClient()
  const { data: messagesResult, isLoading } = useConversationMessages(conversation.id)
  const sendMessage = useSendMessage(conversation.id)
  const [body, setBody] = useState('')

  // Once messages load for this conversation, the server has marked them as read.
  // Sync the true server count back so the badge reflects reality.
  const syncedConvIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (messagesResult && conversation.id !== syncedConvIdRef.current) {
      syncedConvIdRef.current = conversation.id
      queryClient.invalidateQueries({ queryKey: ['messaging', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
    }
  }, [messagesResult, conversation.id, queryClient])

  const messages = messagesResult?.data ?? []
  const other =
    conversation.participantA.id === currentUserId
      ? conversation.participantB
      : conversation.participantA

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    await sendMessage.mutateAsync({ body: body.trim() })
    setBody('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <p className="font-semibold text-gray-900">
          {other.firstName} {other.lastName}
        </p>
        <p className="text-xs text-gray-500">{other.email}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-3/4" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p
                    className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'} text-right`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e as unknown as React.FormEvent)
              }
            }}
          />
          <Button
            type="submit"
            disabled={!body.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Announcement Detail Panel ────────────────────────────────────────────────

function AnnouncementPanel({
  announcement,
}: {
  announcement: AnnouncementWithRelations
}) {
  const markRead = useMarkAnnouncementRead()

  const handleMarkRead = () => {
    if (!announcement.isRead) {
      markRead.mutate(announcement.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <p className="font-semibold text-gray-900">{announcement.subject}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          From {announcement.author.firstName} {announcement.author.lastName} ·{' '}
          {formatTime(announcement.sentAt!)}
          {announcement.targetRole && (
            <> · <Badge variant="default" className="ml-1">{announcement.targetRole}</Badge></>
          )}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {announcement.body}
          </pre>
        </div>
      </div>
      {!announcement.isRead && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <Button variant="outline" size="sm" onClick={handleMarkRead} disabled={markRead.isPending}>
            Mark as read
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []
  const canAnnounce = ANNOUNCE_ROLES.some((r) => userRoles.includes(r))

  const { data: convsResult, isLoading: convsLoading } = useConversations()
  const { data: announcementsResult, isLoading: annLoading } = useAnnouncements()
  const { data: draftAnnouncements } = useDraftAnnouncements()
  const { data: usersResult } = useUsers({ perPage: 100 })

  const startConversation = useStartConversation()
  const createAnnouncement = useCreateAnnouncement()
  const deleteAnnouncement = useDeleteAnnouncement()

  const markConversationRead = useMarkConversationRead()

  const [activeTab, setActiveTab] = useState('messages')
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null)

  // Compose DM dialog
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeUserId, setComposeUserId] = useState('')
  const [composeBody, setComposeBody] = useState('')

  // Compose announcement dialog
  const [announceOpen, setAnnounceOpen] = useState(false)
  const [announceForm, setAnnounceForm] = useState({
    subject: '',
    body: '',
    targetRole: 'ALL',
    scheduledAt: '',
  })

  // Delete draft dialog
  const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null)

  const conversations = convsResult?.data ?? []
  const announcements = announcementsResult?.data ?? []
  const selectedConv = conversations.find((c) => c.id === selectedConvId) ?? null
  const selectedAnn = announcements.find((a) => a.id === selectedAnnId) ?? null
  const users = usersResult?.data ?? []

  const otherUsers = users.filter((u) => u.id !== user?.id)

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeUserId || !composeBody.trim()) return
    const result = await startConversation.mutateAsync({
      userId: composeUserId,
      body: { body: composeBody.trim() },
    })
    setComposeOpen(false)
    setComposeUserId('')
    setComposeBody('')
    setActiveTab('messages')
    setSelectedConvId(result.conversation.id)
  }

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    await createAnnouncement.mutateAsync({
      subject: announceForm.subject,
      body: announceForm.body,
      targetRole: announceForm.targetRole === 'ALL' ? undefined : announceForm.targetRole,
      scheduledAt: announceForm.scheduledAt ? new Date(announceForm.scheduledAt) : undefined,
    })
    setAnnounceOpen(false)
    setAnnounceForm({ subject: '', body: '', targetRole: 'ALL', scheduledAt: '' })
  }

  const handleDeleteDraft = async () => {
    if (!deleteDraftId) return
    await deleteAnnouncement.mutateAsync(deleteDraftId)
    setDeleteDraftId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Messages' }]}
          />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Messages</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setComposeOpen(true)}>
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            New Message
          </Button>
          {canAnnounce && (
            <Button onClick={() => setAnnounceOpen(true)}>
              <MegaphoneIcon className="h-4 w-4 mr-2" />
              Announcement
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="messages">Direct Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          {canAnnounce && <TabsTrigger value="drafts">Drafts & Scheduled</TabsTrigger>}
        </TabsList>

        {/* ── Direct Messages Tab ── */}
        <TabsContent value="messages">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white h-[600px]">
            {/* Conversation list */}
            <div className="w-72 border-r border-gray-200 overflow-y-auto flex-shrink-0">
              {convsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center gap-3">
                  <ChatBubbleLeftRightIcon className="h-10 w-10" />
                  <p>No conversations yet.</p>
                  <Button size="sm" variant="outline" onClick={() => setComposeOpen(true)}>
                    Start one
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other =
                    conv.participantA.id === user?.id ? conv.participantB : conv.participantA
                  const isSelected = selectedConv?.id === conv.id
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setSelectedConvId(conv.id); markConversationRead(conv) }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                        {other.firstName[0]}{other.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {other.firstName} {other.lastName}
                          </p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        {conv.latestMessage && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.latestMessage.senderId === user?.id ? 'You: ' : ''}
                            {conv.latestMessage.body}
                          </p>
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge variant="primary" className="mt-1 text-xs">
                            {conv.unreadCount} unread
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Thread view */}
            <div className="flex-1 overflow-hidden">
              {selectedConv && user ? (
                <ThreadPanel conversation={selectedConv} currentUserId={user.id} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <ChatBubbleLeftRightIcon className="h-12 w-12" />
                  <p className="text-sm">Select a conversation to read messages</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Announcements Tab ── */}
        <TabsContent value="announcements">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white h-[600px]">
            {/* Announcement list */}
            <div className="w-80 border-r border-gray-200 overflow-y-auto flex-shrink-0">
              {annLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-3 border-b border-gray-100 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center gap-3">
                  <MegaphoneIcon className="h-10 w-10" />
                  <p>No announcements yet.</p>
                </div>
              ) : (
                announcements.map((ann) => {
                  const isSelected = selectedAnn?.id === ann.id
                  return (
                    <button
                      key={ann.id}
                      onClick={() => setSelectedAnnId(ann.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            ann.isRead ? 'text-gray-600' : 'text-gray-900'
                          }`}
                        >
                          {!ann.isRead && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mb-0.5" />
                          )}
                          {ann.subject}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatTime(ann.sentAt!)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ann.author.firstName} {ann.author.lastName}
                        {ann.targetRole && ` · ${ann.targetRole}`}
                      </p>
                    </button>
                  )
                })
              )}
            </div>

            {/* Announcement detail */}
            <div className="flex-1 overflow-hidden">
              {selectedAnn ? (
                <AnnouncementPanel announcement={selectedAnn} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <MegaphoneIcon className="h-12 w-12" />
                  <p className="text-sm">Select an announcement to read</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Drafts & Scheduled Tab (managers only) ── */}
        {canAnnounce && (
          <TabsContent value="drafts">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {!draftAnnouncements || draftAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                  <MegaphoneIcon className="h-10 w-10" />
                  <p className="text-sm">No drafts or scheduled announcements.</p>
                  <Button size="sm" onClick={() => setAnnounceOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create one
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Subject</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Target</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Scheduled</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                      <th className="w-16 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {draftAnnouncements.map((draft) => (
                      <tr key={draft.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{draft.subject}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {draft.targetRole ?? 'All Users'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {draft.scheduledAt
                            ? new Date(draft.scheduledAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={draft.scheduledAt ? 'warning' : 'default'}>
                            {draft.scheduledAt ? 'Scheduled' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDraftId(draft.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Compose DM Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendDM} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dm-recipient">Recipient *</Label>
              <Select value={composeUserId} onValueChange={setComposeUserId}>
                <SelectTrigger id="dm-recipient">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {otherUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dm-body">Message *</Label>
              <Textarea
                id="dm-body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!composeUserId || !composeBody.trim() || startConversation.isPending}
              >
                {startConversation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compose Announcement Dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendAnnouncement} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="ann-subject">Subject *</Label>
              <Input
                id="ann-subject"
                value={announceForm.subject}
                onChange={(e) => setAnnounceForm({ ...announceForm, subject: e.target.value })}
                placeholder="Announcement subject"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ann-target">Send To</Label>
                <Select
                  value={announceForm.targetRole}
                  onValueChange={(v) => setAnnounceForm({ ...announceForm, targetRole: v })}
                >
                  <SelectTrigger id="ann-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ann-schedule">Schedule (optional)</Label>
                <Input
                  id="ann-schedule"
                  type="datetime-local"
                  value={announceForm.scheduledAt}
                  onChange={(e) => setAnnounceForm({ ...announceForm, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-body">Message *</Label>
              <Textarea
                id="ann-body"
                value={announceForm.body}
                onChange={(e) => setAnnounceForm({ ...announceForm, body: e.target.value })}
                placeholder="Write your announcement..."
                rows={6}
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              {announceForm.scheduledAt
                ? 'This announcement will be saved as scheduled and sent at the specified time.'
                : 'This announcement will be sent immediately to recipients.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createAnnouncement.isPending}>
                {createAnnouncement.isPending
                  ? 'Sending...'
                  : announceForm.scheduledAt
                    ? 'Schedule'
                    : 'Send Announcement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Draft Confirmation */}
      <Dialog open={!!deleteDraftId} onOpenChange={() => setDeleteDraftId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-4">
            Are you sure you want to delete this draft announcement? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={handleDeleteDraft}
              disabled={deleteAnnouncement.isPending}
            >
              {deleteAnnouncement.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
