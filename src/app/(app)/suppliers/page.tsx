// src/app/(app)/suppliers/page.tsx
// Suppliers list page — Server Component.
// Fetches all active suppliers + a material count per supplier.

import type { Metadata }             from 'next'
import { getServerSupabaseClient }   from '@/lib/supabase/server'
import { AddSupplierDialog }         from '@/components/suppliers/AddSupplierDialog'
import { SuppliersTable, type SupplierWithCount } from '@/components/suppliers/SuppliersTable'

export const metadata: Metadata = { title: 'Furnizori' }

export default async function SuppliersPage() {
  const sb = getServerSupabaseClient()

  // Fetch suppliers + the count of active materials linked to each
  const { data: suppliersRaw, count } = await sb
    .from('suppliers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('name')

  // Get material counts per supplier in one query
  const { data: materialCounts } = await sb
    .from('materials')
    .select('supplier_id')
    .eq('is_active', true)
    .not('supplier_id', 'is', null)

  // Build a lookup: supplierId → count
  const countMap: Record<string, number> = {}
  for (const row of materialCounts ?? []) {
    if (row.supplier_id) {
      countMap[row.supplier_id] = (countMap[row.supplier_id] ?? 0) + 1
    }
  }

  const suppliers: SupplierWithCount[] = (suppliersRaw ?? []).map(s => ({
    ...s,
    material_count: countMap[s.id] ?? 0,
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Furnizori</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} furnizor{(count ?? 0) !== 1 ? 'i' : ''} activ{(count ?? 0) !== 1 ? 'i' : ''} în catalog
          </p>
        </div>
        <AddSupplierDialog />
      </div>

      <SuppliersTable suppliers={suppliers} />

    </div>
  )
}
