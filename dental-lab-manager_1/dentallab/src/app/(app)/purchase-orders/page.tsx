// src/app/(app)/purchase-orders/page.tsx
// Purchase Orders list — Server Component.
// Fetches orders + items + suppliers in parallel, passes to client table.

import type { Metadata }              from 'next'
import { getServerSupabaseClient }    from '@/lib/supabase/server'
import { CreatePoDialog }             from '@/components/purchase-orders/CreatePoDialog'
import { PurchaseOrdersTable }        from '@/components/purchase-orders/PurchaseOrdersTable'
import type { Supplier, Material, PurchaseOrder, PurchaseOrderItem } from '@/types'

export const metadata: Metadata = { title: 'Comenzi Achiziție' }

export default async function PurchaseOrdersPage() {
  const sb = getServerSupabaseClient()

  const [
    { data: ordersRaw,   count },
    { data: itemsRaw },
    { data: suppliersRaw },
    { data: materialsRaw },
  ] = await Promise.all([
    // Orders with supplier info joined
    sb.from('purchase_orders')
      .select('*, suppliers(id, name, contact_name, email, phone)', { count: 'exact' })
      .order('created_at', { ascending: false }),

    // All items for all orders (we join them client-side to avoid N+1)
    sb.from('purchase_order_items')
      .select('*')
      .order('created_at', { ascending: true }),

    // Suppliers for the Create dialog dropdown
    sb.from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name'),

    // Active materials for the Create dialog line-item picker
    sb.from('materials')
      .select('id, name, sku, unit, cost_per_unit, quantity, min_threshold, is_active, created_at, updated_at, category_id, supplier_id, expiry_date, location, notes')
      .eq('is_active', true)
      .order('name'),
  ])

  const orders    = (ordersRaw    ?? []) as any[]
  const items     = (itemsRaw     ?? []) as PurchaseOrderItem[]
  const suppliers = (suppliersRaw ?? []) as Supplier[]
  const materials = (materialsRaw ?? []) as Material[]

  // Group items by purchase_order_id for O(1) lookup when building the table rows
  const itemsByOrder: Record<string, PurchaseOrderItem[]> = {}
  for (const item of items) {
    const oid = item.purchase_order_id
    if (!itemsByOrder[oid]) itemsByOrder[oid] = []
    itemsByOrder[oid].push(item)
  }

  // Shape the data for PurchaseOrdersTable
  const ordersWithDetails = orders.map(o => ({
    ...o,
    items:      itemsByOrder[o.id] ?? [],
    item_count: (itemsByOrder[o.id] ?? []).length,
  }))

  // Stats
  const draft    = orders.filter(o => o.status === 'draft').length
  const ordered  = orders.filter(o => o.status === 'ordered').length
  const received = orders.filter(o => o.status === 'received').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comenzi de Achiziție</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} comand{(count ?? 0) !== 1 ? 'ă' : 'e'} înregistrat{(count ?? 0) !== 1 ? 'e' : 'ă'}
          </p>
        </div>
        <CreatePoDialog suppliers={suppliers} materials={materials} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Schițe',        value: draft,    color: 'text-slate-600',   bg: 'bg-slate-50'   },
          { label: 'Trimise',       value: ordered,  color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Recepționate',  value: received, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <PurchaseOrdersTable orders={ordersWithDetails} />
    </div>
  )
}
