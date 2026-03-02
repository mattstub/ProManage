import { cva } from 'class-variance-authority'

import { cn } from '../utils/cn'

import type { VariantProps } from 'class-variance-authority'

const statusVariants = cva('inline-block rounded-full', {
  variants: {
    status: {
      active: 'bg-green-500',
      inactive: 'bg-gray-400',
      pending: 'bg-yellow-500',
      error: 'bg-red-500',
    },
    size: {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
    },
  },
  defaultVariants: {
    status: 'inactive',
    size: 'md',
  },
})

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {
  label?: string
}

export function StatusIndicator({
  className,
  status,
  size,
  label,
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      role="status"
      aria-label={label ?? status ?? undefined}
      className={cn(statusVariants({ status, size }), className)}
      {...props}
    />
  )
}
