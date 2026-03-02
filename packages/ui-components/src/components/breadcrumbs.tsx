import { cn } from '../utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items, className, ...props }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)} {...props}>
      <ol className="flex items-center gap-1.5 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden className="text-gray-300">
                /
              </span>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={
                  index === items.length - 1
                    ? 'text-gray-900 font-medium'
                    : undefined
                }
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
