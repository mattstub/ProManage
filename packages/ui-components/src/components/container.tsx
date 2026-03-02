import { cva } from 'class-variance-authority'

import { cn } from '../utils/cn'

import type { VariantProps } from 'class-variance-authority'

const containerVariants = cva('mx-auto w-full px-4', {
  variants: {
    maxWidth: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
      '6xl': 'max-w-6xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    maxWidth: '6xl',
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export function Container({ className, maxWidth, ...props }: ContainerProps) {
  return (
    <div className={cn(containerVariants({ maxWidth }), className)} {...props} />
  )
}
