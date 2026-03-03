'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@promanage/ui-components'

interface NavItemProps {
  href: string
  label: string
  icon?: React.ReactNode
}

export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </Link>
  )
}
