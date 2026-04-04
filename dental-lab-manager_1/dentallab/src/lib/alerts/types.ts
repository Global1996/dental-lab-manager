// src/lib/alerts/types.ts
// All alert-related types used across the app.
// Import with: import type { Alert, AlertSeverity } from '@/lib/alerts/types'

// ─── Severity ─────────────────────────────────────────────────────────────────
// critical → red  — requires immediate action (out of stock, already expired)
// warning  → amber — needs attention soon (low stock, expiring in ≤30 days)
// info     → blue  — informational (expiring in 31-60 days)

export type AlertSeverity = 'critical' | 'warning' | 'info'

// ─── Alert kinds ──────────────────────────────────────────────────────────────

export type AlertKind =
  | 'out_of_stock'    // quantity === 0
  | 'low_stock'       // 0 < quantity <= min_threshold
  | 'expired'         // expiry_date < today
  | 'expiring_soon'   // expiry_date within EXPIRY_WARNING_DAYS (default 30)
  | 'expiring_later'  // expiry_date within EXPIRY_INFO_DAYS (default 60)

// ─── Alert object ─────────────────────────────────────────────────────────────

export interface Alert {
  id:          string        // material id — unique within a kind
  kind:        AlertKind
  severity:    AlertSeverity
  title:       string        // short headline e.g. "Out of Stock"
  message:     string        // human-readable description
  material: {
    id:            string
    name:          string
    sku:           string | null
    unit:          string
    quantity:      number
    min_threshold: number
    expiry_date:   string | null
    location:      string | null
    category_name: string | null
  }
  // Only present on expiry alerts
  days_until_expiry?: number
  // Only present on stock alerts
  stock_percent?: number     // quantity / min_threshold * 100, capped at 100
}

// ─── Alert summary for the layout badge ──────────────────────────────────────

export interface AlertSummary {
  total:    number
  critical: number
  warning:  number
  info:     number
}

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Centralised here so changing one number updates the whole system.

export const EXPIRY_CRITICAL_DAYS = 7    // ≤ 7 days → critical
export const EXPIRY_WARNING_DAYS  = 30   // ≤ 30 days → warning
export const EXPIRY_INFO_DAYS     = 60   // ≤ 60 days → info
