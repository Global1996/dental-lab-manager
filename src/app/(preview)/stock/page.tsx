// src/app/(preview)/stock/page.tsx
import type { Metadata } from 'next'
import { MovementsTable, type MovementRow } from '@/components/stock/MovementsTable'

export const metadata: Metadata = { title: 'Stock Movements' }

const now = new Date()
const ago = (m: number) => new Date(now.getTime() - m * 60_000).toISOString()

const MOVEMENTS: MovementRow[] = [
  { id: '1', material_id: 'm1', movement_type: 'in',         quantity: 50,  unit_cost: 8.40,  reason: 'Monthly restock order',   case_id: null, batch_number: 'BT-2025-001', expiry_date: null,         created_at: ago(12),  materials: { name: 'IPS e.max CAD A2',      unit: 'piece' } },
  { id: '2', material_id: 'm2', movement_type: 'case_usage', quantity: 3,   unit_cost: null,  reason: null,                      case_id: 'c1', batch_number: null,          expiry_date: null,         created_at: ago(47),  materials: { name: 'Vita Zirconia HT',      unit: 'g'     } },
  { id: '3', material_id: 'm3', movement_type: 'out',        quantity: 5,   unit_cost: null,  reason: 'Damaged on trim',         case_id: null, batch_number: null,          expiry_date: null,         created_at: ago(95),  materials: { name: 'Temp Crown Resin',      unit: 'piece' } },
  { id: '4', material_id: 'm4', movement_type: 'in',         quantity: 200, unit_cost: 0.45,  reason: null,                      case_id: null, batch_number: 'BT-2025-002', expiry_date: '2026-01-01', created_at: ago(180), materials: { name: 'Impression Putty Base',  unit: 'ml'    } },
  { id: '5', material_id: 'm1', movement_type: 'adjustment', quantity: 2,   unit_cost: null,  reason: 'Stocktake correction +2', case_id: null, batch_number: null,          expiry_date: null,         created_at: ago(310), materials: { name: 'IPS e.max CAD A2',      unit: 'piece' } },
  { id: '6', material_id: 'm5', movement_type: 'case_usage', quantity: 8,   unit_cost: null,  reason: null,                      case_id: 'c2', batch_number: null,          expiry_date: null,         created_at: ago(420), materials: { name: 'Zirconia Disc 98mm',    unit: 'g'     } },
  { id: '7', material_id: 'm6', movement_type: 'return',     quantity: 10,  unit_cost: 2.10,  reason: 'Supplier return — wrong shade', case_id: null, batch_number: null,   expiry_date: null,         created_at: ago(600), materials: { name: 'Metal Bond Ceramic',    unit: 'g'     } },
  { id: '8', material_id: 'm7', movement_type: 'expired',    quantity: 4,   unit_cost: null,  reason: 'Past expiry date',        case_id: null, batch_number: 'BT-2024-088', expiry_date: '2024-12-28', created_at: ago(900), materials: { name: 'Impression Alginate',   unit: 'pack'  } },
]

export default function PreviewStockPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {MOVEMENTS.length} movements shown · mock data
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            Stock In
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            Stock Out
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
            Adjust
          </button>
        </div>
      </div>
      <MovementsTable movements={MOVEMENTS} />
    </div>
  )
}
