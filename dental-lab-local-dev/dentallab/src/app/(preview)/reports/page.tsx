// src/app/(preview)/reports/page.tsx
import type { Metadata } from 'next'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reports' }

export default function PreviewReportsPage() {
  const summaries = [
    { label: 'Total Revenue (completed)',  value: formatCurrency(14_820),  note: '22 cases' },
    { label: 'Total Cost',                 value: formatCurrency(8_934),   note: 'Materials + Labour + Machine' },
    { label: 'Gross Profit',               value: formatCurrency(5_886),   note: '39.7% margin' },
    { label: 'Material Cost',              value: formatCurrency(2_105),   note: 'From case usage' },
    { label: 'Current Stock Value',        value: formatCurrency(12_840),  note: 'At purchase price' },
  ]
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Summary metrics across all completed cases</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(({ label, value, note }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {['Monthly Revenue vs Cost', 'Case Volume by Type', 'Most Used Materials', 'Profit Margin Trend'].map(title => (
          <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold text-sm mb-4">{title}</h2>
            <div className="h-40 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Recharts chart — Phase 3</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
