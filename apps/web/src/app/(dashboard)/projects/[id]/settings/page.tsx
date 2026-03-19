'use client'

import { use, useState } from 'react'

import { Label, Skeleton } from '@promanage/ui-components'

import type { UpdateProjectSettingsInput } from '@promanage/api-client'
import type { RoleName } from '@promanage/core'

import { useAuth } from '@/hooks/use-auth'
import { useProjectSettings, useUpdateProjectSettings } from '@/hooks/use-projects'


const SETTINGS_ROLES: RoleName[] = ['Admin', 'ProjectManager']

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label id={`${id}-label`} htmlFor={id} className="font-medium text-gray-900">{label}</Label>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { data: settings, isLoading } = useProjectSettings(id)
  const updateSettings = useUpdateProjectSettings()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canManage = SETTINGS_ROLES.some((r) => user?.roles.includes(r))

  async function handleToggle(field: keyof UpdateProjectSettingsInput, value: boolean) {
    if (!canManage) return
    setError(null)
    setSaved(false)
    try {
      await updateSettings.mutateAsync({
        projectId: id,
        input: { [field]: value },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings'
      setError(msg)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-lg">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure modules and requirements for this project.</p>
      </div>

      {!canManage && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          You need Admin or Project Manager role to change settings.
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        <div className="p-4 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modules</p>
          <Toggle
            id="enable-safety"
            label="Safety Module"
            description="Enable safety documents, toolbox talks, and incident reports."
            checked={settings?.enableSafetyModule ?? true}
            onChange={(v) => handleToggle('enableSafetyModule', v)}
            disabled={!canManage || updateSettings.isPending}
          />
          <Toggle
            id="enable-documents"
            label="Documents Module"
            description="Enable project document management."
            checked={settings?.enableDocumentsModule ?? false}
            onChange={(v) => handleToggle('enableDocumentsModule', v)}
            disabled={!canManage || updateSettings.isPending}
          />
        </div>
        <div className="p-4 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requirements</p>
          <Toggle
            id="require-daily-reports"
            label="Require Daily Reports"
            description="Field users must submit a daily report before clocking out."
            checked={settings?.requireDailyReports ?? false}
            onChange={(v) => handleToggle('requireDailyReports', v)}
            disabled={!canManage || updateSettings.isPending}
          />
          <Toggle
            id="require-time-tracking"
            label="Require Time Tracking"
            description="Track hours for all workers on this project."
            checked={settings?.requireTimeTracking ?? false}
            onChange={(v) => handleToggle('requireTimeTracking', v)}
            disabled={!canManage || updateSettings.isPending}
          />
        </div>
        <div className="p-4 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notifications</p>
          <Toggle
            id="notify-incident"
            label="Notify on Incident"
            description="Send notifications when an incident report is filed."
            checked={settings?.notifyOnIncident ?? true}
            onChange={(v) => handleToggle('notifyOnIncident', v)}
            disabled={!canManage || updateSettings.isPending}
          />
          <Toggle
            id="notify-daily-report"
            label="Notify on Daily Report"
            description="Send notifications when a daily report is submitted."
            checked={settings?.notifyOnDailyReport ?? false}
            onChange={(v) => handleToggle('notifyOnDailyReport', v)}
            disabled={!canManage || updateSettings.isPending}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Settings saved.</p>}
    </div>
  )
}
