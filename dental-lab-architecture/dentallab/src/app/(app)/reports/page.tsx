// src/app/(app)/reports/page.tsx
// Reports — summary metrics for profitability, stock value, and usage.
// Full charts (Recharts), date filters, and export — Phase 3.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const sb = getServerSupabaseClient()

  // Aggregate totals from cases
  const { data: caseTotals } = await sb
    .from('cases')
    .select('total_cost, final_price, estimated_profit, material_cost, status')

  const completed  = (caseTotals ?? []).filter((c: any) => c.status === 'completed' || c.status === 'delivered')
  const totalRev   = completed.reduce((s: number, c: any) => s + Number(c.final_price),       0)
  const totalCost  = completed.reduce((s: number, c: any) => s + Number(c.total_cost),        0)
  const totalProf  = completed.reduce((s: number, c: any) => s + Number(c.estimated_profit),  0)
  const totalMat   = completed.reduce((s: number, c: any) => s + Number(c.material_cost),     0)
  const margin     = totalRev > 0 ? (totalProf / totalRev) * 100 : 0

  // Stock value
  const { data: stockData } = await sb
    .from('stock_levels')
    .select('total_quantity, materials(unit_cost, name)')

  const stockValue = (stockData ?? []).reduce((s: number, r: any) => {
    return s + r.total_quantity * (r.materials?.unit_cost ?? 0)
  }, 0)

  const summaries = [
    { label: 'Total Revenue (completed)',  value: formatCurrency(totalRev),  note: `${completed.length} cases` },
    { label: 'Total Cost',                 value: formatCurrency(totalCost), note: 'Materials + Labour + Machine' },
    { label: 'Gross Profit',               value: formatCurrency(totalProf), note: `${margin.toFixed(1)}% margin` },
    { label: 'Material Cost',              value: formatCurrency(totalMat),  note: 'From case usage' },
    { label: 'Current Stock Value',        value: formatCurrency(stockValue),note: 'At purchase price' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Summary metrics across all completed cases</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map(({ label, value, note }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{note}</p>
          </div>
        ))}
      </div>

      {/* Chart placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          'Monthly Revenue vs Cost (Bar Chart)',
          'Case Volume by Type (Pie Chart)',
          'Most Used Materials (Bar Chart)',
          'Profit Margin Trend (Line Chart)',
        ].map(title => (
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
