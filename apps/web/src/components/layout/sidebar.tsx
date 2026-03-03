import Link from 'next/link'

import { NavItem } from './nav-item'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/contacts', label: 'Contacts' },
]

export function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-lg font-bold text-blue-700">
          ProManage
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
    </aside>
  )
}
