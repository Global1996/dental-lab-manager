// src/components/dashboard/ExpiringMaterialsWidget.tsx
// Shows materials with expiry_date within the next 60 days, plus already-expired ones.
// Server component — data is fetched and passed in as props.

import Link from 'next/link'
import { CalendarClock, CalendarX2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExpiringItem {
  id:          string
  name:        string
  sku:         string | null
  expiry_date: string
  quantity:    number
  unit:        string
}

interface Props {
  items: ExpiringItem[]
}

function daysUntil(dateStr: string): number {
  const now   = new Date(); now.setHours(0, 0, 0, 0)
  const exp   = new Date(dateStr)
  return Math.floor((exp.getTime() - now.getTime()) / 86400000)
}

function formatExpiry(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function ExpiringMaterialsWidget({ items }: Props) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
        <CheckCircle2 className="w-7 h-7 text-emerald-500 opacity-70" />
        <p className="text-sm font-medium">No upcoming expirations</p>
        <p className="text-xs">No materials expiring within 60 days</p>
      </div>
    )
  }

  const sorted = [...items].sort(
    (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  )

  return (
    <div className="space-y-2">
      {sorted.map(item => {
        const days    = daysUntil(item.expiry_date)
        const expired = days < 0
        const urgent  = !expired && days <= 7

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border p-3',
              expired ? 'border-red-200   bg-red-50/50'
              : urgent ? 'border-orange-200 bg-orange-50/50'
              :          'border-yellow-200 bg-yellow-50/30'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {expired
                    ? <CalendarX2    className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    : <CalendarClock className={cn('w-3.5 h-3.5 shrink-0',
                        urgent ? 'text-orange-500' : 'text-yellow-600'
                      )} />
                  }
                  <p className="text-sm font-semibold truncate">{item.name}</p>
                </div>
                {item.sku && (
                  <p className="text-xs text-muted-foreground font-mono ml-5 mt-0.5">{item.sku}</p>
                )}
                <p className="text-xs text-muted-foreground ml-5 mt-0.5">
                  {item.quantity} {item.unit} in stock
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className={cn(
                  'text-xs font-bold',
                  expired ? 'text-red-600'
                  : urgent ? 'text-orange-600'
                  :          'text-yellow-700'
                )}>
                  {expired
                    ? `${Math.abs(days)}d ago`
                    : days === 0 ? 'Today!'
                    : `${days}d left`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatExpiry(item.expiry_date)}
                </p>
              </div>
            </div>
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
