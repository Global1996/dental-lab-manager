// src/components/dashboard/StatCard.tsx
// Reusable KPI metric card.
// Supports a trend indicator (up/down/neutral) and an optional sub-label.

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label:     string
  value:     string | number
  icon:      React.ElementType
  iconColor: string      // e.g. 'text-blue-600'
  iconBg:    string      // e.g. 'bg-blue-50'
  sub?:      string      // secondary descriptor below the value
  trend?:    'up' | 'down' | 'neutral'
  trendText?:string      // e.g. '+3 this week'
  href?:     string
}

export function StatCard({
  label, value, icon: Icon,
  iconColor, iconBg,
  sub, trend, trendText,
}: Props) {
  const TrendIcon =
    trend === 'up'   ? TrendingUp   :
    trend === 'down' ? TrendingDown : Minus

  const trendColor =
    trend === 'up'   ? 'text-emerald-600' :
    trend === 'down' ? 'text-red-500'     :
    'text-muted-foreground'

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          )}
        </div>

        <div className={cn('p-2.5 rounded-xl shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>

      {trend && trendText && (
        <div className={cn('flex items-center gap-1 mt-3 pt-3 border-t', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span className="text-xs font-medium">{trendText}</span>
        </div>
      )}
    </div>
  )
}
