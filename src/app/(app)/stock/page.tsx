// src/app/(app)/stock/page.tsx
// Stock Movements — with inline low-stock/out-of-stock alert cards above the table.

import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { StockInDialog }         from '@/components/stock/StockInDialog'
import { StockOutDialog }        from '@/components/stock/StockOutDialog'
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog'
import { MovementsTable, type MovementRow } from '@/components/stock/MovementsTable'
import { AlertTriangle, XCircle, ChevronRight } from 'lucide-react'
import type { MaterialWithJoins } from '@/types'

export const metadata: Metadata = { title: 'Mișcări de stoc' }

export default async function StockPage() {
  const sb = getServerSupabaseClient()

  const [
    { data: movementsRaw, count },
    { data: materialsRaw },
    { data: casesRaw },
  ] = await Promise.all([
    sb
      .from('stock_movements')
      .select('id, material_id, movement_type, quantity, unit_cost, reason, case_id, batch_number, expiry_date, created_at, materials(name, unit)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(200),
    sb
      .from('materials')
      .select('*, categories(id, name, color), suppliers(id, name)')
      .eq('is_active', true)
      .order('name'),
    sb
      .from('cases')
      .select('id, case_code, patient_name')
      .in('status', ['draft', 'in_progress', 'awaiting_approval'])
      .order('case_code'),
  ])

  const movements = (movementsRaw ?? []) as MovementRow[]
  const materials = (materialsRaw ?? []) as MaterialWithJoins[]
  const cases     = (casesRaw     ?? []) as { id: string; case_code: string; patient_name: string }[]

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayMovements = movements.filter(m => new Date(m.created_at) >= todayStart).length

  // Compute low/out-of-stock materials for inline warning cards
  const outOfStock  = materials.filter(m => Number(m.quantity) <= 0)
  const lowStock    = materials.filter(m => {
    const q = Number(m.quantity), t = Number(m.min_threshold)
    return q > 0 && t > 0 && q <= t
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mișcări de stoc</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} {(count ?? 0) !== 1 ? 'mișcări' : 'mișcare'} înregistrat{(count ?? 0) !== 1 ? 'e' : 'ă'} în total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StockInDialog         materials={materials} />
          <StockOutDialog        materials={materials} cases={cases} />
          <StockAdjustmentDialog materials={materials} />
        </div>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Materiale', value: materials.length,  color: 'text-foreground'       },
          { label: 'Stoc Epuizat',    value: outOfStock.length, color: outOfStock.length > 0 ? 'text-red-600'   : 'text-foreground' },
          { label: 'Stoc Redus',      value: lowStock.length,   color: lowStock.length   > 0 ? 'text-amber-600' : 'text-foreground' },
          { label: 'Mișcări Azi',     value: todayMovements,    color: 'text-primary'          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Out-of-stock inline alerts */}
      {outOfStock.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-800">
              {outOfStock.length} {outOfStock.length === 1 ? 'material epuizat' : 'materiale epuizate'} — reaprovizionare necesară
            </p>
            <Link href="/alerts" className="ml-auto text-xs font-medium text-red-700 hover:text-red-900 flex items-center gap-1">
              Toate alertele <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-red-100">
            {outOfStock.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-red-900">{m.name}</span>
                  {m.sku && <span className="ml-2 font-mono text-xs text-red-600">{m.sku}</span>}
                </div>
                <span className="text-xs font-bold text-red-600">
                  0 {m.unit} {Number(m.min_threshold) > 0 ? `/ min ${m.min_threshold}` : ''}
                </span>
              </div>
            ))}
            {outOfStock.length > 5 && (
              <div className="px-4 py-2 text-xs text-red-600">
                +{outOfStock.length - 5} materiale epuizate suplimentare
              </div>
            )}
          </div>
        </div>
      )}

      {/* Low-stock inline alerts (only if no out-of-stock, to avoid clutter) */}
      {outOfStock.length === 0 && lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {lowStock.length} {lowStock.length === 1 ? 'material cu stoc redus' : 'materiale cu stoc redus'}
            </p>
            <Link href="/alerts" className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1">
              Toate alertele <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-amber-100">
            {lowStock.slice(0, 4).map(m => {
              const pct = Number(m.min_threshold) > 0
                ? Math.round((Number(m.quantity) / Number(m.min_threshold)) * 100)
                : 0
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-amber-900">{m.name}</span>
                    {m.sku && <span className="ml-2 font-mono text-xs text-amber-600">{m.sku}</span>}
                    <div className="mt-1 h-1 rounded-full bg-amber-200 overflow-hidden w-24">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 shrink-0">
                    {m.quantity} / {m.min_threshold} {m.unit}
                  </span>
                </div>
              )
            })}
            {lowStock.length > 4 && (
              <div className="px-4 py-2 text-xs text-amber-600">
                +{lowStock.length - 4} materiale cu stoc redus suplimentare
              </div>
            )}
          </div>
        </div>
      )}

      <MovementsTable movements={movements} />
    </div>
  )
}
