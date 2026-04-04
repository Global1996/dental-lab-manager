'use client'
// src/components/stock/MovementsTable.tsx
// Stock movement history with grouped timeline view + search/type filters.

import { useState, useMemo } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal,
  RotateCcw, AlertCircle, FlaskConical, Package2,
} from 'lucide-react'
import { SearchInput }    from '@/components/ui/SearchInput'
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils'
import type { MovementType } from '@/types'

export interface MovementRow {
  id:            string
  material_id:   string
  movement_type: MovementType
  quantity:      number
  unit_cost:     number | null
  reason:        string | null
  case_id:       string | null
  batch_number:  string | null
  expiry_date:   string | null
  created_at:    string
  materials:     { name: string; unit: string } | null
}

const TYPE_CONFIG: Record<MovementType, {
  label: string; Icon: React.ElementType
  color: string; bg: string; border: string
  sign: '+' | '−'; debit: boolean
}> = {
  in:         { label: 'Intrare Stoc',    Icon: ArrowDownToLine,   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', sign: '+', debit: false },
  out:        { label: 'Ieșire Stoc',     Icon: ArrowUpFromLine,   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     sign: '−', debit: true  },
  case_usage: { label: 'Utilizat pe Caz', Icon: FlaskConical,      color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    sign: '−', debit: true  },
  adjustment: { label: 'Ajustare',        Icon: SlidersHorizontal, color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200',  sign: '+', debit: false },
  return:     { label: 'Retur',           Icon: RotateCcw,         color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   sign: '+', debit: false },
  expired:    { label: 'Expirat',         Icon: AlertCircle,       color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-200',   sign: '−', debit: true  },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as MovementType[]

// Group movements by calendar date
function groupByDate(rows: MovementRow[]): { date: string; items: MovementRow[] }[] {
  const map = new Map<string, MovementRow[]>()
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(r)
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }))
}

function formatGroupDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  const dt = new Date(iso + 'T00:00:00')
  if (dt.toDateString() === today.toDateString()) return 'Azi'
  if (dt.toDateString() === yesterday.toDateString()) return 'Ieri'
  return d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props { movements: MovementRow[] }

export function MovementsTable({ movements }: Props) {
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return movements.filter(m => {
      if (typeFilter !== 'all' && m.movement_type !== typeFilter) return false
      if (q && !(m.materials?.name ?? '').toLowerCase().includes(q) &&
               !(m.reason ?? '').toLowerCase().includes(q) &&
               !(m.batch_number ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [movements, search, typeFilter])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  // Summary counts for the filter chips
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<MovementType, number>> = {}
    for (const m of movements) counts[m.movement_type] = (counts[m.movement_type] ?? 0) + 1
    return counts
  }, [movements])

  return (
    <div className="space-y-4">

      {/* Search + type filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Caută material, motiv sau lot…"
            className="flex-1 min-w-[200px] max-w-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${typeFilter === 'all' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent text-muted-foreground'}`}
          >
            Toate tipurile
            <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full">{movements.length}</span>
          </button>
          {ALL_TYPES.map(type => {
            const cfg    = TYPE_CONFIG[type]
            const count  = typeCounts[type] ?? 0
            const active = typeFilter === type
            if (count === 0) return null
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${active ? `${cfg.border} ${cfg.bg} ${cfg.color}` : 'border-border hover:bg-accent text-muted-foreground'}`}
              >
                <cfg.Icon className="w-3 h-3" />
                {cfg.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/40' : 'bg-muted'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length === movements.length
            ? `${movements.length} mișcăr${movements.length !== 1 ? 'i' : 'e'}`
            : `${filtered.length} din ${movements.length} mișcări`}
          {(search || typeFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setTypeFilter('all') }}
              className="ml-2 text-primary hover:underline">
              Șterge filtrele
            </button>
          )}
        </p>
      </div>

      {/* Timeline grouped view */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/40">
              <Package2 className="w-7 h-7 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {search || typeFilter !== 'all' ? 'Nicio mișcare nu corespunde filtrelor' : 'Nicio mișcare de stoc înregistrată'}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {search || typeFilter !== 'all'
                  ? 'Modificați filtrele pentru a vedea mai multe rezultate.'
                  : 'Înregistrați prima intrare de stoc folosind butoanele de mai sus.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ date, items }) => (
            <div key={date}>
              {/* Date group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {formatGroupDate(date)}
                </span>
                <div className="flex-1 border-t border-dashed" />
                <span className="text-xs text-muted-foreground">{items.length} mișcăr{items.length !== 1 ? 'i' : 'e'}</span>
              </div>

              {/* Movement cards for this day */}
              <div className="space-y-2">
                {items.map(m => {
                  const cfg = TYPE_CONFIG[m.movement_type] ?? TYPE_CONFIG.adjustment
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border ${cfg.border} ${cfg.bg} px-4 py-3
                                  flex items-start gap-4 hover:opacity-90 transition-opacity`}
                    >
                      {/* Type icon */}
                      <div className={`p-2 rounded-lg bg-white/60 shrink-0 mt-0.5`}>
                        <cfg.Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                              {m.batch_number && (
                                <span className="font-mono text-xs bg-white/60 px-1.5 py-0.5 rounded border text-muted-foreground">
                                  Lot: {m.batch_number}
                                </span>
                              )}
                              {m.case_id && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                                  Caz atașat
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-sm mt-0.5 truncate">
                              {m.materials?.name ?? '—'}
                            </p>
                            {m.reason && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.reason}</p>
                            )}
                          </div>

                          {/* Quantity + cost */}
                          <div className="text-right shrink-0">
                            <p className={`text-lg font-bold tabular-nums
                              ${cfg.debit ? 'text-red-600' : 'text-emerald-600'}`}>
                              {cfg.debit ? '−' : '+'}{Number(m.quantity)} {m.materials?.unit ?? ''}
                            </p>
                            {m.unit_cost && (
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(Number(m.unit_cost))}/unitate
                                <span className="ml-1 font-medium">
                                  = {formatCurrency(Number(m.unit_cost) * Number(m.quantity))}
                                </span>
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatRelative(m.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Expiry date if set on this movement */}
                        {m.expiry_date && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Data expirării lot: <span className="font-medium">{formatDate(m.expiry_date)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
