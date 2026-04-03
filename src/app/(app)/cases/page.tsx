// src/app/(app)/cases/page.tsx
// Cases list page — Server Component.
// Fetches all cases, passes to CasesTable for client-side search/filter.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { CreateCaseDialog } from '@/components/cases/CreateCaseDialog'
import { CasesTable }       from '@/components/cases/CasesTable'
import { formatCurrency } from '@/lib/utils'
import type { Case, CaseStatus } from '@/types'

export const metadata: Metadata = { title: 'Cazuri' }

export default async function CasesPage() {
  const sb = getServerSupabaseClient()

  const { data: casesRaw, count } = await sb
    .from('cases')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  const cases = (casesRaw ?? []) as Case[]

  // Quick stats
  const open      = cases.filter(c => ['draft','in_progress','awaiting_approval'].includes(c.status)).length
  const completed = cases.filter(c => c.status === 'completed' || c.status === 'delivered').length
  const revenue   = cases
    .filter(c => c.status === 'completed' || c.status === 'delivered')
    .reduce((s, c) => s + Number(c.final_price), 0)
  const profit    = cases
    .filter(c => c.status === 'completed' || c.status === 'delivered')
    .reduce((s, c) => s + Number(c.estimated_profit), 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cazuri</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} {(count ?? 0) !== 1 ? 'cazuri' : 'caz'} în total
          </p>
        </div>
        <CreateCaseDialog />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Cazuri Deschise',     value: open,                     color: 'text-blue-600'    },
          { label: 'Finalizate / Livrate', value: completed,               color: 'text-emerald-600' },
          { label: 'Venituri Totale',        value: formatCurrency(revenue), color: 'text-foreground'  },
          { label: 'Profit Total',         value: formatCurrency(profit),  color: profit >= 0 ? 'text-emerald-600' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <CasesTable cases={cases} />
    </div>
  )
}
