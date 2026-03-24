'use client'

import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  FolderOpenIcon,
  HashtagIcon,
  HomeIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'


import { NavItem } from './nav-item'

import type { RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-messaging'

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
    href: '/channels',
    label: 'Channels',
    icon: <HashtagIcon className="h-5 w-5" />,
  },
  {
    href: '/contacts',
    label: 'Contacts',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    href: '/materials',
    label: 'Materials',
    icon: <CubeIcon className="h-5 w-5" />,
    roles: ['Admin', 'ProjectManager', 'OfficeAdmin'] as RoleName[],
  },
  {
    href: '/proposals',
    label: 'Proposals',
    icon: <DocumentTextIcon className="h-5 w-5" />,
    roles: ['Admin', 'ProjectManager', 'OfficeAdmin'] as RoleName[],
  },
  {
    href: '/licenses',
    label: 'Licenses',
    icon: <IdentificationIcon className="h-5 w-5" />,
  },
  {
    href: '/safety',
    label: 'Safety',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
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
  const { data: unreadData } = useUnreadCount()
  const unreadMessages = unreadData?.total ?? 0

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
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href === '/messages' ? unreadMessages : undefined}
          />
        ))}
      </nav>
    </aside>
  )
}
