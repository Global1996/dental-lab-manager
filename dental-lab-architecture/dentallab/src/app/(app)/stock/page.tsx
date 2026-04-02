// src/app/(app)/stock/page.tsx
// Stock Movements — immutable audit log of every quantity change.
// Shows the 50 most recent movements.
// Full form (in/out/adjustment) and filters built in Phase 2.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, RotateCw } from 'lucide-react'

export const metadata: Metadata = { title: 'Stock Movements' }

const TYPE_META = {
  in:         { label: 'Stock In',    icon: ArrowDownCircle, color: 'text-emerald-600' },
  out:        { label: 'Usage / Out', icon: ArrowUpCircle,   color: 'text-red-500'     },
  adjustment: { label: 'Adjustment',  icon: RotateCw,        color: 'text-blue-500'    },
  return:     { label: 'Return',      icon: ArrowDownCircle, color: 'text-amber-500'   },
  expired:    { label: 'Expired',     icon: ArrowUpCircle,   color: 'text-slate-400'   },
} as const

export default async function StockPage() {
  const sb = getServerSupabaseClient()
  const { data: movements, count } = await sb
    .from('stock_movements')
    .select('*, materials(name, unit)', { count: 'exact' })
    .order('performed_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit log of every quantity change — {count ?? 0} total
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-60 cursor-not-allowed"
          title="Available in Phase 2"
        >
          Record Movement
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Type', 'Material', 'Qty', 'Unit Cost', 'Reference', 'Notes', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(movements ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                (movements ?? []).map((m: any) => {
                  const meta = TYPE_META[m.movement_type as keyof typeof TYPE_META]
                  const Icon = meta?.icon ?? RotateCw
                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 font-medium ${meta?.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {meta?.label ?? m.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{m.materials?.name ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {m.movement_type === 'out' || m.movement_type === 'expired'
                          ? `-${m.quantity}`
                          : `+${m.quantity}`
                        } {m.materials?.unit}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {m.unit_cost ? `$${Number(m.unit_cost).toFixed(4)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {m.reference_type ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {m.notes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(m.performed_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Record form, batch import, and filters — Phase 2
      </p>
    </div>
  )
}
