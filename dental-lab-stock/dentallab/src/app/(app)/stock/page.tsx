// src/app/(app)/stock/page.tsx
// Stock Movements — full module.
// Server Component: fetches movements + materials + open cases in parallel,
// then passes typed data to client components.
//
// Data flow:
//   Server fetches movements (latest first) + active materials + open cases
//        ↓
//   <StockInDialog>         → recordStockIn server action
//   <StockOutDialog>        → recordStockOut server action
//   <StockAdjustmentDialog> → recordAdjustment server action
//   <MovementsTable>        → client-side filter + display

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { StockInDialog }         from '@/components/stock/StockInDialog'
import { StockOutDialog }        from '@/components/stock/StockOutDialog'
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog'
import { MovementsTable, type MovementRow } from '@/components/stock/MovementsTable'
import type { MaterialWithStock } from '@/types'

export const metadata: Metadata = { title: 'Stock Movements' }

export default async function StockPage() {
  const sb = getServerSupabaseClient()

  const [
    { data: movementsRaw, count },
    { data: materialsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    // Movements: latest first, join material name+unit and performer name
    sb
      .from('stock_movements')
      .select(`
        id, material_id, movement_type, quantity, unit_cost,
        batch_number, expiry_date, reference_id, reference_type,
        notes, performed_at,
        materials ( name, unit ),
        profiles  ( full_name )
      `, { count: 'exact' })
      .order('performed_at', { ascending: false })
      .limit(200),

    // Active materials for the dialog dropdowns (with current stock level)
    sb
      .from('materials')
      .select('*, categories(id, name, color), suppliers(id, name), stock_levels(total_quantity)')
      .eq('is_active', true)
      .order('name'),

    // Open cases for the optional "link to case" field in Stock Out
    sb
      .from('cases')
      .select('id, case_number, patient_name')
      .in('status', ['draft', 'in_progress', 'awaiting_approval'])
      .order('case_number'),
  ])

  const movements = (movementsRaw ?? []) as MovementRow[]
  const materials = (materialsRaw ?? []) as MaterialWithStock[]
  const cases     = (casesRaw     ?? []) as { id: string; case_number: string; patient_name: string }[]

  // Quick summary stats for the header bar
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayMovements = movements.filter(
    m => new Date(m.performed_at) >= todayStart
  ).length

  const lowStockCount = materials.filter(m => {
    const qty       = m.stock_levels?.total_quantity ?? 0
    const threshold = Number(m.reorder_level) ?? 0
    return qty > 0 && qty <= threshold
  }).length

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} total movement{count !== 1 ? 's' : ''} recorded
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <StockInDialog         materials={materials} />
          <StockOutDialog        materials={materials} cases={cases} />
          <StockAdjustmentDialog materials={materials} />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Materials',   value: materials.length,  color: 'text-foreground'     },
          { label: 'Low Stock Items',   value: lowStockCount,     color: 'text-amber-600'      },
          { label: 'Movements Today',   value: todayMovements,    color: 'text-primary'        },
          { label: 'Total Movements',   value: count ?? 0,        color: 'text-muted-foreground'},
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Movement history */}
      <MovementsTable movements={movements} />

    </div>
  )
}
