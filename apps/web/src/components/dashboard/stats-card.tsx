'use client'

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@promanage/ui-components'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  isLoading?: boolean
  variant?: 'default' | 'blue' | 'green'
}

const variantClasses: Record<NonNullable<StatsCardProps['variant']>, string> = {
  default: 'text-gray-900',
  blue: 'text-blue-700',
  green: 'text-emerald-700',
}

export function StatsCard({
  title,
  value,
  description,
  isLoading = false,
  variant = 'default',
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-20 mb-1" />
            {description && <Skeleton className="h-3 w-32" />}
          </>
        ) : (
          <>
            <p className={cn('text-3xl font-bold', variantClasses[variant])}>{value}</p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
