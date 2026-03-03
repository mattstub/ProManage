'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Grid,
} from '@promanage/ui-components'

import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your projects.
        </p>
      </div>

      <Grid cols={3} gap={6}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Phase 2: real data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">Phase 2: real data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 truncate">
              {user?.organizationId ? 'Loaded' : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Phase 2: org name</p>
          </CardContent>
        </Card>
      </Grid>
    </div>
  )
}
