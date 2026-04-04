// src/app/(app)/alerts/page.tsx
// Dedicated alerts page — shows every active alert grouped by severity,
// with filter tabs (All / Critical / Warning / Info) and a summary bar.
// All data fetched server-side; no client state needed.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { fetchAlerts }             from '@/lib/alerts/query'
import { AlertsPanel }             from '@/components/alerts/AlertsPanel'
import { AlertsSummaryBar }        from '@/components/alerts/AlertsSummaryBar'
import { AlertFilterTabs }         from './AlertFilterTabs'
import { Bell, RefreshCw }            from 'lucide-react'
import type { AlertSeverity }      from '@/lib/alerts/types'

export const metadata: Metadata = { title: 'Alerte' }

interface Props {
  searchParams: { severity?: string }
}

export default async function AlertsPage({ searchParams }: Props) {
  const sb = getServerSupabaseClient()
  const { alerts, summary } = await fetchAlerts(sb)

  // Filter by severity if ?severity= param is present
  const severityFilter = searchParams.severity as AlertSeverity | undefined
  const filtered = severityFilter
    ? alerts.filter(a => a.severity === severityFilter)
    : alerts

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Alerte</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Materiale cu stoc redus, expirate sau care expiră curând
          </p>
        </div>

        <form>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       text-sm font-medium hover:bg-accent transition-colors text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reîncarcă
          </button>
        </form>
      </div>

      {/* Summary bar */}
      <AlertsSummaryBar summary={summary} />

      {/* Filter tabs */}
      <AlertFilterTabs summary={summary} current={severityFilter} />

      {/* Alerts list */}
      <AlertsPanel
        alerts={filtered}
        variant="full"
      />

    </div>
  )
}
