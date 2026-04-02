'use client'
// src/components/dashboard/RecentMovementsTable.tsx
// Shows the 8 most recent stock movements on the dashboard.
// Compact version of the full movements table — no filters, no pagination.

import Link from 'next/link'
import {
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal,
  RotateCcw, AlertCircle, FlaskConical, ChevronRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface MovementSummary {
  id:            string
  movement_type: string
  quantity:      number
  unit_cost:     number | null
  reason:        string | null
  created_at:    string
  material_name: string
  material_unit: string
}

interface Props {
  movements: MovementSummary[]
}

const TYPE_CFG: Record<string, {
  label: string
  Icon:  React.ElementType
  cls:   string
}> = {
  in:         { label: 'Stock In',    Icon: ArrowDownToLine,  cls: 'bg-emerald-50 text-emerald-700' },
  out:        { label: 'Stock Out',   Icon: ArrowUpFromLine,  cls: 'bg-red-50     text-red-700'     },
  case_usage: { label: 'Case Usage',  Icon: FlaskConical,     cls: 'bg-blue-50    text-blue-700'    },
  adjustment: { label: 'Adjustment',  Icon: SlidersHorizontal,cls: 'bg-slate-50   text-slate-700'   },
  return:     { label: 'Return',      Icon: RotateCcw,        cls: 'bg-amber-50   text-amber-700'   },
  expired:    { label: 'Expired',     Icon: AlertCircle,      cls: 'bg-zinc-50    text-zinc-500'    },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function RecentMovementsTable({ movements }: Props) {
  if (!movements.length) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No movements recorded yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="border-b">
            <th className="text-left pb-2.5 pt-1 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
            <th className="text-left pb-2.5 pt-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Material</th>
            <th className="text-right pb-2.5 pt-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
            <th className="text-right pb-2.5 pt-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Value</th>
            <th className="text-right pb-2.5 pt-1 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {movements.map(m => {
            const cfg = TYPE_CFG[m.movement_type] ?? TYPE_CFG.adjustment
            const Icon = cfg.Icon
            const isDebit = ['out','case_usage','expired'].includes(m.movement_type)
            const value = m.unit_cost ? m.unit_cost * m.quantity : null

            return (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors group">
                <td className="py-2.5 px-1">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                    cfg.cls
                  )}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden lg:inline">{cfg.label}</span>
                  </span>
                </td>
                <td className="py-2.5 px-2 max-w-[160px]">
                  <p className="font-medium truncate">{m.material_name}</p>
                  {m.reason && (
                    <p className="text-xs text-muted-foreground truncate">{m.reason}</p>
                  )}
                </td>
                <td className={cn(
                  'py-2.5 px-2 tabular-nums text-right font-semibold text-sm',
                  isDebit ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {isDebit ? '−' : '+'}{m.quantity} {m.material_unit}
                </td>
                <td className="py-2.5 px-2 tabular-nums text-right text-muted-foreground text-xs hidden sm:table-cell">
                  {value ? formatCurrency(value) : '—'}
                </td>
                <td className="py-2.5 px-1 text-right text-xs text-muted-foreground whitespace-nowrap">
                  {timeAgo(m.created_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-3 pt-3 border-t">
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all movements
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
