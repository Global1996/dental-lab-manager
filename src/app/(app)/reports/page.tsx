// src/app/(app)/reports/page.tsx
// Reports — full profitability, material usage, and stock reports.
// Server Component: fetches all raw data, passes to ReportsClient for
// interactive filtering and Recharts visualisations.

import type { Metadata }            from 'next'
import { getServerSupabaseClient }  from '@/lib/supabase/server'
import { ReportsClient }            from './ReportsClient'

export const metadata: Metadata = { title: 'Rapoarte' }

export default async function ReportsPage() {
  const sb = getServerSupabaseClient()

  const [
    { data: casesRaw },
    { data: usageRaw },
    { data: stockRaw },
  ] = await Promise.all([
    // All cases with cost + status + dates + work_type
    sb.from('cases')
      .select('id, case_code, status, work_type, created_at, completed_date, received_date, total_cost, final_price, estimated_profit, material_cost, labor_cost, machine_cost, profit_margin_pct')
      .order('created_at', { ascending: true }),

    // All material usage with joined material info
    sb.from('case_material_usage')
      .select('quantity_used, unit_cost_at_time, total_cost, created_at, materials(id, name, unit)')
      .order('created_at', { ascending: true }),

    // Current stock for inventory value
    sb.from('materials')
      .select('id, name, quantity, cost_per_unit, unit, categories(name)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <ReportsClient
      cases={casesRaw   ?? []}
      usage={usageRaw   ?? []}
      stock={stockRaw   ?? []}
    />
  )
}
