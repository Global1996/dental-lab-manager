// src/lib/alerts/compute.ts
// Pure functions that derive Alert objects from raw material rows.
// No Supabase dependency — just data transformation.
// Used by: layout.tsx (badge count), dashboard page, /alerts page.

import type { Alert, AlertSummary, AlertKind, AlertSeverity } from './types'
import {
  EXPIRY_CRITICAL_DAYS,
  EXPIRY_WARNING_DAYS,
  EXPIRY_INFO_DAYS,
} from './types'

// ─── Input shape ─────────────────────────────────────────────────────────────
// The minimal set of columns we need from the materials table.

export interface MaterialAlertInput {
  id:            string
  name:          string
  sku:           string | null
  unit:          string
  quantity:      number
  min_threshold: number
  cost_per_unit: number
  expiry_date:   string | null
  location:      string | null
  category_name: string | null
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Days between today (midnight) and the given ISO date string. Negative = past. */
function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000)
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Given an array of active material rows, returns a sorted Alert array.
 * Order: critical first, then warning, then info; alphabetical within each group.
 */
export function computeAlerts(materials: MaterialAlertInput[]): Alert[] {
  const alerts: Alert[] = []

  for (const m of materials) {
    const qty = Number(m.quantity)
    const threshold = Number(m.min_threshold)

    // ── Stock alerts ──────────────────────────────────────────────────────

    if (qty <= 0) {
      alerts.push({
        id:       `stock-${m.id}`,
        kind:     'out_of_stock',
        severity: 'critical',
        title:    'Out of Stock',
        message:  `${m.name} has zero units remaining.${threshold > 0 ? ` Reorder threshold is ${threshold} ${m.unit}.` : ''}`,
        material: pick(m),
        stock_percent: 0,
      })
    } else if (threshold > 0 && qty <= threshold) {
      const pct = Math.round((qty / threshold) * 100)
      alerts.push({
        id:       `stock-${m.id}`,
        kind:     'low_stock',
        severity: 'warning',
        title:    'Low Stock',
        message:  `${m.name} has ${qty} ${m.unit} remaining (${pct}% of minimum threshold ${threshold} ${m.unit}).`,
        material: pick(m),
        stock_percent: pct,
      })
    }

    // ── Expiry alerts ─────────────────────────────────────────────────────

    if (m.expiry_date) {
      const days = daysUntil(m.expiry_date)
      const formatted = formatDate(m.expiry_date)

      if (days < 0) {
        alerts.push({
          id:       `expiry-${m.id}`,
          kind:     'expired',
          severity: 'critical',
          title:    'Expired',
          message:  `${m.name} expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago (${formatted}). Remove from inventory.`,
          material: pick(m),
          days_until_expiry: days,
        })
      } else if (days <= EXPIRY_CRITICAL_DAYS) {
        alerts.push({
          id:       `expiry-${m.id}`,
          kind:     'expiring_soon',
          severity: 'critical',
          title:    'Expiring Very Soon',
          message:  `${m.name} expires in ${days} day${days !== 1 ? 's' : ''} (${formatted}). Use or replace immediately.`,
          material: pick(m),
          days_until_expiry: days,
        })
      } else if (days <= EXPIRY_WARNING_DAYS) {
        alerts.push({
          id:       `expiry-${m.id}`,
          kind:     'expiring_soon',
          severity: 'warning',
          title:    'Expiring Soon',
          message:  `${m.name} expires in ${days} days (${formatted}).`,
          material: pick(m),
          days_until_expiry: days,
        })
      } else if (days <= EXPIRY_INFO_DAYS) {
        alerts.push({
          id:       `expiry-${m.id}`,
          kind:     'expiring_later',
          severity: 'info',
          title:    'Expiry Notice',
          message:  `${m.name} expires in ${days} days (${formatted}).`,
          material: pick(m),
          days_until_expiry: days,
        })
      }
    }
  }

  // Sort: critical → warning → info, then alphabetical by name
  const ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => {
    const sev = ORDER[a.severity] - ORDER[b.severity]
    if (sev !== 0) return sev
    return a.material.name.localeCompare(b.material.name)
  })

  return alerts
}

// ─── Summary helper ───────────────────────────────────────────────────────────

export function summariseAlerts(alerts: Alert[]): AlertSummary {
  return {
    total:    alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning:  alerts.filter(a => a.severity === 'warning').length,
    info:     alerts.filter(a => a.severity === 'info').length,
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function pick(m: MaterialAlertInput) {
  return {
    id:            m.id,
    name:          m.name,
    sku:           m.sku,
    unit:          m.unit,
    quantity:      Number(m.quantity),
    min_threshold: Number(m.min_threshold),
    expiry_date:   m.expiry_date,
    location:      m.location,
    category_name: m.category_name,
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}
