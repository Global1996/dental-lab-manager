// src/app/(app)/dashboard/page.tsx
// Dashboard — high-level stats drawn live from Supabase.
// Stat cards are real queries; charts will be added in Phase 2.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  Package2, AlertTriangle, Briefcase,
  TrendingUp, ShieldAlert,
} from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const sb = getServerSupabaseClient()

  const [
    { count: totalMaterials },
    { data: stockRows },
    { count: openCases },
    { count: alertCount },
  ] = await Promise.all([
    sb.from('materials').select('*', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('stock_levels').select('total_quantity, materials(reorder_level)'),
    sb.from('cases').select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress', 'awaiting_approval']),
    sb.from('stock_movements').select('*', { count: 'exact', head: true })
      .gte('performed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  const lowStock = (stockRows ?? []).filter((r: any) => {
    const level = r.materials?.reorder_level ?? 0
    return r.total_quantity <= level && r.total_quantity > 0
  }).length

  const outOfStock = (stockRows ?? []).filter((r: any) => r.total_quantity <= 0).length

  const stats = [
    { label: 'Active Materials', value: totalMaterials ?? 0, icon: Package2,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Low Stock',        value: lowStock,             icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50'  },
    { label: 'Out of Stock',     value: outOfStock,           icon: ShieldAlert,   color: 'text-red-600',    bg: 'bg-red-50'    },
    { label: 'Open Cases',       value: openCases ?? 0,       icon: Briefcase,     color: 'text-emerald-600',bg: 'bg-emerald-50'},
    { label: 'Movements (7d)',   value: alertCount ?? 0,      icon: TrendingUp,    color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Live overview of your dental lab operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder panels — will be wired up in Phase 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-1">Recent Cases</h2>
          <p className="text-sm text-muted-foreground">Case list with status and costs — Phase 2</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-1">Stock Alerts</h2>
          <p className="text-sm text-muted-foreground">Low stock and expiry alerts feed — Phase 2</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold mb-1">Stock Movement Chart</h2>
          <p className="text-sm text-muted-foreground">Recharts time-series chart — Phase 2</p>
          <div className="h-40 flex items-center justify-center bg-muted/30 rounded-lg mt-4">
            <span className="text-xs text-muted-foreground">Chart placeholder</span>
          </div>
        </div>
      </div>
    </div>
  )
}
