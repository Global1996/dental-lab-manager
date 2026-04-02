// src/lib/alerts/query.ts
// Server-side Supabase query that fetches all the data needed to compute alerts.
// Separated so it can be called from both the layout and individual pages
// without duplicating the query.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { computeAlerts, summariseAlerts, type MaterialAlertInput } from './compute'
import type { Alert, AlertSummary } from './types'
import { EXPIRY_INFO_DAYS } from './types'

/**
 * Fetches active materials that have either:
 *   – a non-zero min_threshold (needed to detect low-stock)
 *   – an expiry_date within EXPIRY_INFO_DAYS from today
 *
 * Then runs computeAlerts() and returns both the full list and a summary.
 * This single query + in-memory filter is faster than four separate queries.
 */
export async function fetchAlerts(
  supabase: SupabaseClient<Database>
): Promise<{ alerts: Alert[]; summary: AlertSummary }> {

  const cutoff = new Date(Date.now() + EXPIRY_INFO_DAYS * 86_400_000)
    .toISOString()
    .split('T')[0]

  // Fetch all active materials — we need quantity vs min_threshold for EVERY
  // material to catch zero-stock items even when min_threshold is 0.
  const { data, error } = await supabase
    .from('materials')
    .select(`
      id, name, sku, unit,
      quantity, min_threshold, cost_per_unit,
      expiry_date, location,
      categories ( name )
    `)
    .eq('is_active', true)
    .order('name')

  if (error || !data) {
    return { alerts: [], summary: { total: 0, critical: 0, warning: 0, info: 0 } }
  }

  const inputs: MaterialAlertInput[] = data.map((m: any) => ({
    id:            m.id,
    name:          m.name,
    sku:           m.sku,
    unit:          m.unit,
    quantity:      Number(m.quantity),
    min_threshold: Number(m.min_threshold),
    cost_per_unit: Number(m.cost_per_unit),
    expiry_date:   m.expiry_date ?? null,
    location:      m.location ?? null,
    category_name: m.categories?.name ?? null,
  }))

  const alerts  = computeAlerts(inputs)
  const summary = summariseAlerts(alerts)

  return { alerts, summary }
}
