import { cva } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '../utils/cn'

import type { VariantProps } from 'class-variance-authority'

const textareaVariants = cva(
  'flex w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      state: {
        default: 'border-gray-300 focus-visible:ring-blue-500',
        error: 'border-red-500 focus-visible:ring-red-500',
      },
      resize: {
        none: 'resize-none',
        y: 'resize-y',
        x: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      state: 'default',
      resize: 'y',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state, resize, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(textareaVariants({ state, resize }), className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
