// src/components/dashboard/LowStockWidget.tsx
// Shows materials that are at or below their min_threshold.
// Server component — no client state needed.

import Link from 'next/link'
import { AlertTriangle, XCircle, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

export interface LowStockItem {
  id:            string
  name:          string
  sku:           string | null
  quantity:      number
  min_threshold: number
  unit:          string
  cost_per_unit: number
  category_name: string | null
  category_color:string | null
}

interface Props {
  items: LowStockItem[]
}

export function LowStockWidget({ items }: Props) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
        <CheckCircle2 className="w-7 h-7 text-emerald-500 opacity-70" />
        <p className="text-sm font-medium">All stock levels are healthy</p>
        <p className="text-xs">No materials below minimum threshold</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const isOut  = item.quantity <= 0
        const pct    = item.min_threshold > 0
          ? Math.min((item.quantity / item.min_threshold) * 100, 100)
          : 0

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border p-3 transition-colors',
              isOut
                ? 'border-red-200 bg-red-50/50'
                : 'border-amber-200 bg-amber-50/50'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isOut
                    ? <XCircle       className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  }
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                </div>
                {item.sku && (
                  <p className="text-xs text-muted-foreground font-mono ml-5 mt-0.5">{item.sku}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className={cn(
                  'text-sm font-bold tabular-nums',
                  isOut ? 'text-red-600' : 'text-amber-600'
                )}>
                  {item.quantity} {item.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  min: {item.min_threshold}
                </p>
              </div>
            </div>

            {/* Stock level bar */}
            {!isOut && (
              <div className="mt-2 h-1.5 rounded-full bg-amber-200/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        )
      })}

      <div className="pt-1">
        <Link
          href="/materials"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Manage materials
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
