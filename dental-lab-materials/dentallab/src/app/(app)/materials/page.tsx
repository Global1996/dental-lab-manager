// src/app/(app)/materials/page.tsx
// Materials catalogue — full CRUD with search, add, edit, delete.
// This is a Server Component. It fetches all data from Supabase, then passes
// it to the client components (MaterialsTable, AddMaterialDialog).
//
// Data flow:
//   Server Component fetches materials + categories + suppliers
//        ↓
//   <MaterialsTable>   handles client-side search + renders rows
//   <AddMaterialDialog> opens the create dialog (pre-loaded with categories/suppliers)
//   <EditMaterialDialog> (inside each row) opens the edit dialog
//   <DeleteMaterialButton> (inside each row) confirms + soft-deletes

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { MaterialsTable } from '@/components/materials/MaterialsTable'
import { AddMaterialDialog } from '@/components/materials/AddMaterialDialog'
import type { MaterialWithStock, Category, Supplier } from '@/types'

export const metadata: Metadata = { title: 'Materials' }

export default async function MaterialsPage() {
  const sb = getServerSupabaseClient()

  // Fetch all three resources in parallel
  const [
    { data: materialsRaw, count },
    { data: categories },
    { data: suppliers },
  ] = await Promise.all([
    sb
      .from('materials')
      .select('*, categories(id, name, color), suppliers(id, name), stock_levels(total_quantity)', {
        count: 'exact',
      })
      .eq('is_active', true)
      .order('name'),
    sb.from('categories').select('*').order('name'),
    sb.from('suppliers').select('id, name').eq('is_active', true).order('name'),
  ])

  const materials  = (materialsRaw  ?? []) as MaterialWithStock[]
  const cats       = (categories    ?? []) as Category[]
  const supps      = (suppliers     ?? []) as Supplier[]

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} active material{count !== 1 ? 's' : ''} in catalogue
          </p>
        </div>

        {/* Add button — opens dialog; needs categories + suppliers pre-loaded */}
        <AddMaterialDialog categories={cats} suppliers={supps} />
      </div>

      {/* Table with client-side search */}
      <MaterialsTable
        materials={materials}
        categories={cats}
        suppliers={supps}
      />

    </div>
  )
}
