// src/components/alerts/AlertBadge.tsx
// Compact severity pill. Used inline in tables and next to item names.
// Pure display — no data fetching.

import { AlertTriangle, AlertCircle, Info, XCircle, CalendarX2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertSeverity, AlertKind } from '@/lib/alerts/types'

interface Props {
  severity:  AlertSeverity
  kind:      AlertKind
  className?: string
  /** Show just the icon without the text label */
  iconOnly?: boolean
}

const KIND_LABEL: Record<AlertKind, string> = {
  out_of_stock:   'Stoc Epuizat',
  low_stock:      'Stoc Redus',
  expired:        'Expirat',
  expiring_soon:  'Expiră Curând',
  expiring_later: 'Notificare Expirare',
}

const KIND_ICON: Record<AlertKind, React.ElementType> = {
  out_of_stock:   XCircle,
  low_stock:      AlertTriangle,
  expired:        CalendarX2,
  expiring_soon:  AlertCircle,
  expiring_later: Info,
}

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: 'bg-red-50    text-red-700    border-red-200',
  warning:  'bg-amber-50  text-amber-700  border-amber-200',
  info:     'bg-blue-50   text-blue-700   border-blue-200',
}

export function AlertBadge({ severity, kind, className, iconOnly = false }: Props) {
  const Icon  = KIND_ICON[kind]
  const label = KIND_LABEL[kind]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-semibold',
        SEVERITY_STYLES[severity],
        className
      )}
      title={iconOnly ? label : undefined}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {!iconOnly && <span>{label}</span>}
    </span>
  )
}
