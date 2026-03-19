'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Breadcrumbs, Skeleton } from '@promanage/ui-components'

import { useProject } from '@/hooks/use-projects'

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Team', href: '/team' },
  { label: 'Scopes', href: '/scopes' },
  { label: 'Settings', href: '/settings' },
]

export default function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params
  const pathname = usePathname()
  const { data: project, isLoading } = useProject(id)

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Projects', href: '/projects' },
            { label: isLoading ? '…' : (project?.name ?? id) },
          ]}
        />
        <div className="mt-2 flex items-center justify-between">
          {isLoading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">#{project?.number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => {
            const href = `/projects/${id}${tab.href}`
            const isActive = tab.href === ''
              ? pathname === `/projects/${id}` || pathname === `/projects/${id}/`
              : pathname.startsWith(`/projects/${id}${tab.href}`)

            return (
              <Link
                key={tab.label}
                href={href}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
