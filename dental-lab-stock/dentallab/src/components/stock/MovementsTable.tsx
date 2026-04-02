'use client'
// src/components/stock/MovementsTable.tsx
// Renders the full stock movement history with client-side filtering.
// Filters: movement type, material name search.
// Sorting: always latest-first (done server-side, preserved here).

import { useState, useMemo } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal,
  RotateCcw, AlertCircle, Search, XCircle, Package2,
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils'
import type { MovementType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MovementRow {
  id:            string
  material_id:   string
  movement_type: MovementType
  quantity:      number
  unit_cost:     number | null
  batch_number:  string | null
  expiry_date:   string | null
  reference_id:  string | null
  reference_type:string | null
  notes:         string | null
  performed_at:  string
  // Joined
  materials:     { name: string; unit: string } | null
  profiles:      { full_name: string } | null
}

// ─── Display config per movement type ────────────────────────────────────────

const TYPE_CONFIG: Record<MovementType, {
  label:   string
  Icon:    React.ElementType
  color:   string
  bg:      string
  sign:    '+' | '−'
  textColor: string
}> = {
  in:         { label: 'Stock In',    Icon: ArrowDownToLine,  color: 'text-emerald-600', bg: 'bg-emerald-50', sign: '+', textColor: 'text-emerald-700' },
  out:        { label: 'Stock Out',   Icon: ArrowUpFromLine,  color: 'text-red-600',     bg: 'bg-red-50',     sign: '−', textColor: 'text-red-700'     },
  adjustment: { label: 'Adjustment',  Icon: SlidersHorizontal,color: 'text-blue-600',    bg: 'bg-blue-50',    sign: '+', textColor: 'text-blue-700'    },
  return:     { label: 'Return',      Icon: RotateCcw,        color: 'text-amber-600',   bg: 'bg-amber-50',   sign: '+', textColor: 'text-amber-700'   },
  expired:    { label: 'Expired',     Icon: AlertCircle,      color: 'text-slate-500',   bg: 'bg-slate-50',   sign: '−', textColor: 'text-slate-600'   },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as MovementType[]

interface Props {
  movements: MovementRow[]
}

export function MovementsTable({ movements }: Props) {
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')

  const filtered = useMemo(() => {
    return movements.filter(m => {
      const matchesType   = typeFilter === 'all' || m.movement_type === typeFilter
      const q             = search.trim().toLowerCase()
      const matchesSearch = !q ||
        (m.materials?.name ?? '').toLowerCase().includes(q) ||
        (m.notes ?? '').toLowerCase().includes(q) ||
        (m.batch_number ?? '').toLowerCase().includes(q) ||
        (m.reference_type ?? '').toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [movements, search, typeFilter])

  return (
    <div className="space-y-4">

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search material or notes…"
            className="w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', ...ALL_TYPES] as const).map(type => {
            const active  = typeFilter === type
            const config  = type !== 'all' ? TYPE_CONFIG[type] : null
            const Icon    = config?.Icon
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                             border transition-colors
                             ${active
                               ? 'border-primary bg-primary/10 text-primary'
                               : 'border-border hover:bg-accent text-muted-foreground'}`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {type === 'all' ? 'All types' : config!.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === movements.length
          ? `${movements.length} movement${movements.length !== 1 ? 's' : ''}`
          : `${filtered.length} of ${movements.length} movements`
        }
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Type','Material','Change','Unit Cost','Batch','Reference','Performed by','Notes','Date'].map(h => (
                  <th key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground
                               uppercase tracking-wide whitespace-nowrap">
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
                        {search || typeFilter !== 'all'
                          ? 'No movements match your filters'
                          : 'No stock movements recorded yet'}
                      </p>
                      {(search || typeFilter !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setTypeFilter('all') }}
                          className="text-xs text-primary hover:underline">
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(m => {
                const cfg = TYPE_CONFIG[m.movement_type] ?? TYPE_CONFIG.adjustment
                const Icon = cfg.Icon

                // Determine if reference_type was 'adjustment' (our marker for reductions)
                // to show the correct sign in the UI
                const isReduction = m.movement_type === 'out'
                const sign = isReduction ? '−' : '+'

                return (
                  <tr key={m.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors">

                    {/* Type badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1
                                        rounded-md text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>

                    {/* Material */}
                    <td className="px-4 py-3">
                      <span className="font-medium">{m.materials?.name ?? '—'}</span>
                    </td>

                    {/* Quantity change */}
                    <td className="px-4 py-3 tabular-nums font-semibold">
                      <span className={isReduction ? 'text-red-600' : 'text-emerald-600'}>
                        {sign}{Number(m.quantity)} {m.materials?.unit ?? ''}
                      </span>
                    </td>

                    {/* Unit cost */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {m.unit_cost ? formatCurrency(Number(m.unit_cost)) : '—'}
                    </td>

                    {/* Batch number */}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {m.batch_number ?? '—'}
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {m.reference_type === 'case' && m.reference_id
                        ? <span className="font-mono text-primary">{m.reference_id.slice(0,8)}…</span>
                        : m.reference_type ?? '—'
                      }
                    </td>

                    {/* Performed by */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {m.profiles?.full_name ?? '—'}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <span className="block truncate" title={m.notes ?? ''}>
                        {m.notes ?? '—'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <span className="block text-xs">{formatDate(m.performed_at)}</span>
                      <span className="block text-xs opacity-70">{formatRelative(m.performed_at)}</span>
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
