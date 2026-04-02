'use client'
// src/components/materials/MaterialsTable.tsx
// Client component that owns the search state and renders the full table.
// Receives pre-fetched materials from the Server Component (page.tsx).
// Filtering happens client-side for instant response — no re-fetch on keystroke.

import { useState, useMemo } from 'react'
import { Search, Package2, AlertTriangle, XCircle, ShieldOff } from 'lucide-react'
import { EditMaterialDialog } from './EditMaterialDialog'
import { DeleteMaterialButton } from './DeleteMaterialButton'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { MaterialWithStock, Category, Supplier } from '@/types'

interface Props {
  materials:  MaterialWithStock[]
  categories: Category[]
  suppliers:  Supplier[]
}

// Stock status badge config
const STOCK_BADGE = {
  ok:  { label: 'In Stock',   classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low: { label: 'Low Stock',  classes: 'bg-amber-50  text-amber-700  border-amber-200',  icon: AlertTriangle },
  out: { label: 'Out of Stock',classes: 'bg-red-50    text-red-700    border-red-200',    icon: XCircle },
}

export function MaterialsTable({ materials, categories, suppliers }: Props) {
  const [search, setSearch] = useState('')

  // Client-side filter: match name OR sku (case-insensitive)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.sku ?? '').toLowerCase().includes(q) ||
      (m.categories?.name ?? '').toLowerCase().includes(q)
    )
  }, [materials, search])

  // Derive stock status client-side from joined data
  function getStockStatus(m: MaterialWithStock): 'ok' | 'low' | 'out' {
    const qty     = m.stock_levels?.total_quantity ?? 0
    const threshold = Number(m.reorder_level) ?? 0
    if (qty <= 0)         return 'out'
    if (qty <= threshold) return 'low'
    return 'ok'
  }

  return (
    <div className="space-y-4">

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, SKU or category…"
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm
                     placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === materials.length
          ? `${materials.length} material${materials.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${materials.length} materials`
        }
        {search && ` matching "${search}"`}
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {[
                  'Material',
                  'Category',
                  'Unit',
                  'Cost/Unit',
                  'Stock',
                  'Min Threshold',
                  'Expiry',
                  'Supplier',
                  'Actions',
                ].map(h => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold
                               text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package2 className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {search ? 'No materials match your search' : 'No materials yet'}
                      </p>
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(m => {
                  const status = getStockStatus(m)
                  const badge  = STOCK_BADGE[status]
                  const BadgeIcon = (badge as any).icon

                  return (
                    <tr
                      key={m.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      {/* Material name + SKU */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-start gap-2">
                          {!m.is_active && (
                            <ShieldOff className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0"
                              title="Inactive" />
                          )}
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${!m.is_active ? 'text-muted-foreground line-through' : ''}`}>
                              {m.name}
                            </p>
                            {m.sku && (
                              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                {m.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        {m.categories ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                       font-medium border"
                            style={
                              m.categories.color
                                ? {
                                    backgroundColor: m.categories.color + '18',
                                    borderColor:     m.categories.color + '44',
                                    color:           m.categories.color,
                                  }
                                : {}
                            }
                          >
                            {m.categories.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {m.unit}
                      </td>

                      {/* Cost per unit */}
                      <td className="px-4 py-3 tabular-nums">
                        {formatCurrency(Number(m.unit_cost))}
                      </td>

                      {/* Stock quantity + status badge */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums font-medium">
                            {m.stock_levels?.total_quantity ?? 0}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5
                                        rounded text-xs font-medium border ${badge.classes}`}
                          >
                            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                            {badge.label}
                          </span>
                        </div>
                      </td>

                      {/* Min threshold */}
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {Number(m.reorder_level) > 0 ? m.reorder_level : '—'}
                      </td>

                      {/* Expiry info */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {m.has_expiry
                          ? `Alert ${m.expiry_warning_days}d before`
                          : '—'
                        }
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 text-muted-foreground max-w-[140px]">
                        <span className="truncate block">
                          {m.suppliers?.name ?? '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <EditMaterialDialog
                            material={m}
                            categories={categories}
                            suppliers={suppliers}
                          />
                          <DeleteMaterialButton
                            materialId={m.id}
                            materialName={m.name}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
