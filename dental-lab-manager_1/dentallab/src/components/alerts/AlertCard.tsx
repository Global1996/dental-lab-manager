'use client'
// src/components/alerts/AlertCard.tsx
// A single alert rendered as a card. Supports:
//   - compact  (for the dashboard sidebar widget, list view)
//   - full     (for the /alerts page, full detail)
// The card itself is pure display. Dismiss state is handled by the parent.

import Link from 'next/link'
import {
  AlertTriangle, XCircle, CalendarX2, AlertCircle, Info,
  Package2, MapPin, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert, AlertSeverity, AlertKind } from '@/lib/alerts/types'

// ─── Severity → visual config ────────────────────────────────────────────────

const SEV: Record<AlertSeverity, {
  border: string; bg: string; icon: string; text: string; badge: string
}> = {
  critical: {
    border: 'border-red-200',
    bg:     'bg-red-50/60',
    icon:   'text-red-500',
    text:   'text-red-800',
    badge:  'bg-red-100 text-red-700',
  },
  warning: {
    border: 'border-amber-200',
    bg:     'bg-amber-50/60',
    icon:   'text-amber-500',
    text:   'text-amber-800',
    badge:  'bg-amber-100 text-amber-700',
  },
  info: {
    border: 'border-blue-200',
    bg:     'bg-blue-50/40',
    icon:   'text-blue-500',
    text:   'text-blue-800',
    badge:  'bg-blue-100 text-blue-700',
  },
}

const KIND_ICON: Record<AlertKind, React.ElementType> = {
  out_of_stock:   XCircle,
  low_stock:      AlertTriangle,
  expired:        CalendarX2,
  expiring_soon:  AlertCircle,
  expiring_later: Info,
}

const KIND_LABEL: Record<AlertKind, string> = {
  out_of_stock:   'Stoc Epuizat',
  low_stock:      'Stoc Redus',
  expired:        'Expirat',
  expiring_soon:  'Expiră Curând',
  expiring_later: 'Notificare Expirare',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  alert:    Alert
  variant?: 'compact' | 'full'
}

export function AlertCard({ alert, variant = 'compact' }: Props) {
  const s    = SEV[alert.severity]
  const Icon = KIND_ICON[alert.kind]
  const m    = alert.material

  if (variant === 'compact') {
    return (
      <div className={cn(
        'rounded-lg border p-3 flex items-start gap-3',
        s.border, s.bg
      )}>
        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', s.icon)} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn('text-sm font-semibold truncate', s.text)}>
                {m.name}
              </p>
              {m.sku && (
                <p className="text-xs text-muted-foreground font-mono">{m.sku}</p>
              )}
            </div>
            <span className={cn(
              'text-xs font-semibold px-1.5 py-0.5 rounded shrink-0',
              s.badge
            )}>
              {KIND_LABEL[alert.kind]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.message}</p>
        </div>
      </div>
    )
  }

  // full variant
  return (
    <div className={cn(
      'rounded-xl border p-4 flex items-start gap-4',
      s.border, s.bg
    )}>
      {/* Icon */}
      <div className={cn(
        'p-2.5 rounded-xl shrink-0',
        alert.severity === 'critical' ? 'bg-red-100'
          : alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
      )}>
        <Icon className={cn('w-5 h-5', s.icon)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className={cn('font-semibold', s.text)}>{alert.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
          </div>
          <span className={cn(
            'text-xs font-bold px-2 py-1 rounded-full shrink-0',
            s.badge
          )}>
            {alert.severity.toUpperCase()}
          </span>
        </div>

        {/* Material meta row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
          {m.category_name && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {m.category_name}
            </span>
          )}
          {m.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {m.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Package2 className="w-3 h-3" />
            {m.quantity} {m.unit} în stoc
          </span>
          {m.min_threshold > 0 && (
            <span>Prag minim: {m.min_threshold} {m.unit}</span>
          )}
        </div>

        {/* Nivel stoc bar for stock alerts */}
        {(alert.kind === 'low_stock' || alert.kind === 'out_of_stock') &&
          m.min_threshold > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Nivel stoc</span>
              <span className="font-medium">
                {m.quantity} / {m.min_threshold} {m.unit} (prag)
              </span>
            </div>
            <div className="h-2 rounded-full bg-background/80 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  alert.kind === 'out_of_stock' ? 'bg-red-500' : 'bg-amber-500'
                )}
                style={{
                  width: `${Math.min(
                    m.min_threshold > 0 ? (m.quantity / m.min_threshold) * 100 : 0,
                    100
                  )}%`
                }}
              />
            </div>
          </div>
        )}

        {/* View material link */}
        <div className="mt-3">
          <Link
            href="/materials"
            className="text-xs font-medium text-primary hover:underline"
          >
            Vezi în Materiale →
          </Link>
        </div>
      </div>
    </div>
  )
}
