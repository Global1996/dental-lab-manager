// src/components/alerts/AlertsPanel.tsx
// Renders alerts grouped by severity (critical → warning → info).
// Used on the dashboard (compact variant) and on /alerts (full variant).
// Pure server component — receives pre-computed alerts as props.

import { AlertCard } from './AlertCard'
import { CheckCircle2, AlertOctagon, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert, AlertSeverity } from '@/lib/alerts/types'

interface Group {
  severity: AlertSeverity
  label:    string
  Icon:     React.ElementType
  color:    string
  bg:       string
  alerts:   Alert[]
}

interface Props {
  alerts:  Alert[]
  variant?: 'compact' | 'full'
  /** Max items to show per group (compact mode only) */
  maxPerGroup?: number
}

export function AlertsPanel({ alerts, variant = 'compact', maxPerGroup }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <div className="p-3 rounded-full bg-emerald-50">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Totul în regulă</p>
          <p className="text-xs mt-0.5">Nu există alerte de stoc sau expirare în acest moment</p>
        </div>
      </div>
    )
  }

  const groups: Group[] = [
    {
      severity: 'critical',
      label:    'Critice',
      Icon:     AlertOctagon,
      color:    'text-red-600',
      bg:       'bg-red-50',
      alerts:   alerts.filter(a => a.severity === 'critical'),
    },
    {
      severity: 'warning',
      label:    'Avertismente',
      Icon:     AlertTriangle,
      color:    'text-amber-600',
      bg:       'bg-amber-50',
      alerts:   alerts.filter(a => a.severity === 'warning'),
    },
    {
      severity: 'info',
      label:    'Informații',
      Icon:     Info,
      color:    'text-blue-600',
      bg:       'bg-blue-50',
      alerts:   alerts.filter(a => a.severity === 'info'),
    },
  ].filter(g => g.alerts.length > 0)

  return (
    <div className="space-y-5">
      {groups.map(({ severity, label, Icon, color, bg, alerts: groupAlerts }) => {
        const visible = maxPerGroup ? groupAlerts.slice(0, maxPerGroup) : groupAlerts
        const hidden  = groupAlerts.length - visible.length

        return (
          <div key={severity}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className={cn('p-1 rounded', bg)}>
                <Icon className={cn('w-3.5 h-3.5', color)} />
              </div>
              <span className={cn('text-xs font-bold uppercase tracking-wider', color)}>
                {label}
              </span>
              <span className={cn(
                'ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full',
                bg, color
              )}>
                {groupAlerts.length}
              </span>
            </div>

            {/* Alert cards */}
            <div className="space-y-2">
              {visible.map(alert => (
                <AlertCard key={alert.id} alert={alert} variant={variant} />
              ))}
              {hidden > 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{hidden} {severity === 'critical' ? 'critice' : severity === 'warning' ? 'avertismente' : 'informații'} în plus
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
