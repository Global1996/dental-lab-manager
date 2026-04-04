'use client'
// src/app/(app)/alerts/AlertFilterTabs.tsx
// Severity filter tabs for the /alerts page.
// Uses URL search params so filters are shareable and bookmarkable.

import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AlertSummary, AlertSeverity } from '@/lib/alerts/types'

interface Tab {
  value:  AlertSeverity | 'all'
  label:  string
  count:  number
  active: string
  hover:  string
}

interface Props {
  summary: AlertSummary
  current?: AlertSeverity
}

export function AlertFilterTabs({ summary, current }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()

  function navigate(severity?: AlertSeverity) {
    const params = new URLSearchParams()
    if (severity) params.set('severity', severity)
    router.push(`${pathname}${params.size ? '?' + params.toString() : ''}`)
  }

  const tabs: Tab[] = [
    {
      value:  'all',
      label:  'Toate',
      count:  summary.total,
      active: 'bg-foreground text-background',
      hover:  'hover:bg-muted',
    },
    {
      value:  'critical',
      label:  'Critice',
      count:  summary.critical,
      active: 'bg-red-600 text-white',
      hover:  'hover:bg-red-50 hover:text-red-700',
    },
    {
      value:  'warning',
      label:  'Avertismente',
      count:  summary.warning,
      active: 'bg-amber-500 text-white',
      hover:  'hover:bg-amber-50 hover:text-amber-700',
    },
    {
      value:  'info',
      label:  'Informații',
      count:  summary.info,
      active: 'bg-blue-600 text-white',
      hover:  'hover:bg-blue-50 hover:text-blue-700',
    },
  ]

  const activeSeverity = current ?? 'all'

  return (
    <div className="flex gap-1.5 flex-wrap p-1 rounded-xl bg-muted/50 border w-fit">
      {tabs.filter(t => t.value === 'all' || t.count > 0).map(tab => {
        const isActive = activeSeverity === tab.value
        return (
          <button
            key={tab.value}
            onClick={() => navigate(tab.value === 'all' ? undefined : tab.value as AlertSeverity)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? tab.active : cn('text-muted-foreground', tab.hover)
            )}
          >
            {tab.label}
            <span className={cn(
              'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
              isActive ? 'bg-white/20' : 'bg-muted'
            )}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
