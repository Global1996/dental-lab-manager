// src/components/alerts/AlertsSummaryBar.tsx
// Compact horizontal row of three count pills.
// Used at the top of the /alerts page and on the dashboard header.

import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertSummary } from '@/lib/alerts/types'

interface Props {
  summary: AlertSummary
  className?: string
}

export function AlertsSummaryBar({ summary, className }: Props) {
  if (summary.total === 0) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 text-emerald-600 text-sm', className)}>
        <CheckCircle2 className="w-4 h-4" />
        <span className="font-medium">Totul în regulă — nicio alertă</span>
      </div>
    )
  }

  const pills = [
    {
      count: summary.critical,
      label: 'Critice',
      Icon:  AlertOctagon,
      cls:   'bg-red-50 text-red-700 border-red-200',
    },
    {
      count: summary.warning,
      label: 'Avertismente',
      Icon:  AlertTriangle,
      cls:   'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      count: summary.info,
      label: 'Informații',
      Icon:  Info,
      cls:   'bg-blue-50 text-blue-700 border-blue-200',
    },
  ].filter(p => p.count > 0)

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {pills.map(({ count, label, Icon, cls }) => (
        <span
          key={label}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
            cls
          )}
        >
          <Icon className="w-3 h-3" />
          {count} {label}
        </span>
      ))}
    </div>
  )
}
