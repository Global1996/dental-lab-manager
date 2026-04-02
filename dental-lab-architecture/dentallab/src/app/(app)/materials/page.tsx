// src/app/(app)/materials/page.tsx
// Materials catalogue — placeholder with column headers.
// Full CRUD (create, edit, delete, search, filter by category) built in Phase 2.

import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Materials' }

export default async function MaterialsPage() {
  const sb = getServerSupabaseClient()
  const { data: materials, count } = await sb
    .from('materials')
    .select('*, categories(name, color), suppliers(name), stock_levels(total_quantity)', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .limit(20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} active materials in catalogue
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-60 cursor-not-allowed"
          title="Available in Phase 2"
        >
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      {/* Table shell */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Name', 'SKU', 'Category', 'Unit', 'Unit Cost', 'Stock', 'Supplier', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(materials ?? []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No materials yet. Add your first material in Phase 2.
                  </td>
                </tr>
              ) : (
                (materials ?? []).map((m: any) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.sku ?? '—'}</td>
                    <td className="px-4 py-3">{m.categories?.name ?? '—'}</td>
                    <td className="px-4 py-3">{m.unit}</td>
                    <td className="px-4 py-3">${Number(m.unit_cost).toFixed(2)}</td>
                    <td className="px-4 py-3">{m.stock_levels?.total_quantity ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.suppliers?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Full CRUD, search, filter, and batch import — Phase 2
      </p>
    </div>
  )
}
