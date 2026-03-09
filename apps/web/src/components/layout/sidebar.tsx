'use client'

import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'


import { NavItem } from './nav-item'

import type { RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'

interface NavItemConfig {
  href: string
  label: string
  icon: React.ReactNode
  roles?: RoleName[]
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: <FolderOpenIcon className="h-5 w-5" />,
  },
  {
    href: '/tasks',
    label: 'Tasks',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
  },
  {
    href: '/procedures',
    label: 'Procedures',
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
  {
    href: '/calendar',
    label: 'Calendar',
    icon: <CalendarDaysIcon className="h-5 w-5" />,
  },
  {
    href: '/organization',
    label: 'Organization',
    icon: <BuildingOffice2Icon className="h-5 w-5" />,
    roles: ['Admin', 'OfficeAdmin'],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Cog6ToothIcon className="h-5 w-5" />,
    roles: ['Admin'],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const userRoles = user?.roles ?? []

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => userRoles.includes(r))
  )

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-lg font-bold text-blue-700">
          ProManage
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
        ))}
      </nav>
    </aside>
  )
}
