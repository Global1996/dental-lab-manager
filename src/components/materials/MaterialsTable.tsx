'use client'
// src/components/materials/MaterialsTable.tsx
// Client component — owns search + filter state.
// Filters: text search, category, supplier, stock status, expiry status.

import { useState, useMemo } from 'react'
import {
  Package2, AlertTriangle, XCircle, ShieldOff,
  CalendarX2, CalendarClock, ChevronDown, X as XIcon,
} from 'lucide-react'
import { SearchInput }        from '@/components/ui/SearchInput'
import { EditMaterialDialog } from './EditMaterialDialog'
import { DeleteMaterialButton } from './DeleteMaterialButton'
import { formatCurrency, formatDate, daysUntil, isExpired } from '@/lib/utils'
import type { MaterialWithJoins, Category, Supplier } from '@/types'
import { ExportButton } from '@/components/ui/ExportButton'
import type { ExportRow } from '@/lib/export'

interface Props {
  materials:         MaterialWithJoins[]
  categories:        Category[]
  suppliers:         Supplier[]
  initialSupplierId?: string   // pre-selects supplier filter (from ?supplier= URL param)
}

const STOCK_BADGE = {
  ok:  { label: 'În Stoc',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low: { label: 'Stoc Redus',  classes: 'bg-amber-50  text-amber-700  border-amber-200', icon: AlertTriangle },
  out: { label: 'Stoc Epuizat',classes: 'bg-red-50    text-red-700    border-red-200',   icon: XCircle },
}

type StockFilter   = 'all' | 'ok' | 'low' | 'out'
type ExpiryFilter  = 'all' | 'expired' | 'expiring' | 'ok'

function getStockStatus(m: MaterialWithJoins): 'ok' | 'low' | 'out' {
  const qty = Number(m.quantity), thr = Number(m.min_threshold)
  if (qty <= 0)       return 'out'
  if (thr > 0 && qty <= thr) return 'low'
  return 'ok'
}

function getExpiryStatus(m: MaterialWithJoins): 'expired' | 'expiring' | 'ok' {
  if (!m.expiry_date) return 'ok'
  const d = daysUntil(m.expiry_date)
  if (d === null) return 'ok'
  if (d < 0)  return 'expired'
  if (d <= 30) return 'expiring'
  return 'ok'
}

function ExpiryCell({ expiry_date }: { expiry_date: string | null }) {
  if (!expiry_date) return <span className="text-muted-foreground">—</span>
  const d = daysUntil(expiry_date)
  if (d === null) return <span className="text-muted-foreground">{formatDate(expiry_date)}</span>

  if (d < 0) return (
    <span className="inline-flex items-center gap-1 text-red-700 font-medium text-xs">
      <CalendarX2 className="w-3 h-3 shrink-0" />
      {formatDate(expiry_date)}
      <span className="ml-0.5 text-red-500">(expirat)</span>
    </span>
  )
  if (d <= 7) return (
    <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs">
      <CalendarClock className="w-3 h-3 shrink-0" />
      {formatDate(expiry_date)}
      <span className="text-red-500">({d}z)</span>
    </span>
  )
  if (d <= 30) return (
    <span className="inline-flex items-center gap-1 text-amber-700 text-xs">
      <CalendarClock className="w-3 h-3 shrink-0" />
      {formatDate(expiry_date)}
      <span className="text-amber-500">({d}z)</span>
    </span>
  )
  return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(expiry_date)}</span>
}

function FilterChip({
  active, onClick, children, color = 'primary'
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string
}) {
  const activeClass =
    color === 'red'   ? 'border-red-500 bg-red-50 text-red-700' :
    color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700' :
    color === 'emerald' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
    'border-primary bg-primary/10 text-primary'
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all
                  ${active ? activeClass : 'border-border hover:bg-accent text-muted-foreground'}`}
    >
      {children}
    </button>
  )
}

// Shape one filtered material row into export columns (human-readable, Romanian headers)
function shapeMaterialRows(materials: MaterialWithJoins[]): ExportRow[] {
  return materials.map(m => ({
    'Denumire':      m.name,
    'SKU':           m.sku ?? '',
    'Categorie':     m.categories?.name ?? '',
    'Furnizor':      m.suppliers?.name ?? '',
    'Unitate':       m.unit,
    'Cost/Unitate':  Number(m.cost_per_unit),
    'Stoc':          Number(m.quantity),
    'Prag Minim':    Number(m.min_threshold),
    'Expirare':      m.expiry_date ?? '',
    'Locație':       m.location ?? '',
    'Note':          m.notes ?? '',
  }))
}

export function MaterialsTable({ materials, categories, suppliers, initialSupplierId = 'all' }: Props) {
  const [search,        setSearch]        = useState('')
  const [categoryId,    setCategoryId]    = useState<string>('all')
  const [supplierId,    setSupplierId]    = useState<string>(initialSupplierId)
  const [stockFilter,   setStockFilter]   = useState<StockFilter>('all')
  const [expiryFilter,  setExpiryFilter]  = useState<ExpiryFilter>('all')

  const hasFilters = search || categoryId !== 'all' || supplierId !== 'all' ||
                     stockFilter !== 'all' || expiryFilter !== 'all'

  function clearAll() {
    setSearch(''); setCategoryId('all'); setSupplierId('all')
    setStockFilter('all'); setExpiryFilter('all')
  }

  // Derive per-filter counts for smart display
  const counts = useMemo(() => {
    const out     = materials.filter(m => Number(m.quantity) <= 0).length
    const low     = materials.filter(m => { const q = Number(m.quantity), t = Number(m.min_threshold); return q > 0 && t > 0 && q <= t }).length
    const expired = materials.filter(m => m.expiry_date && (daysUntil(m.expiry_date) ?? 0) < 0).length
    const expiring= materials.filter(m => { const d = daysUntil(m.expiry_date); return d !== null && d >= 0 && d <= 30 }).length
    return { out, low, expired, expiring }
  }, [materials])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return materials.filter(m => {
      if (q && !m.name.toLowerCase().includes(q) &&
               !(m.sku ?? '').toLowerCase().includes(q) &&
               !(m.categories?.name ?? '').toLowerCase().includes(q) &&
               !(m.suppliers?.name ?? '').toLowerCase().includes(q)) return false
      if (categoryId !== 'all' && m.category_id !== categoryId) return false
      if (supplierId !== 'all' && m.supplier_id !== supplierId) return false
      if (stockFilter !== 'all' && getStockStatus(m) !== stockFilter) return false
      if (expiryFilter !== 'all' && getExpiryStatus(m) !== expiryFilter) return false
      return true
    })
  }, [materials, search, categoryId, supplierId, stockFilter, expiryFilter])

  return (
    <div className="space-y-4">

      {/* Search + filter bar */}
      <div className="space-y-3">

        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Caută după nume, SKU, categorie sau furnizor…"
            className="flex-1 min-w-[240px] max-w-sm"
          />

          {/* Category select */}
          {categories.length > 0 && (
            <div className="relative">
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border bg-background
                           text-sm font-medium transition-colors cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-ring
                           text-muted-foreground hover:bg-accent"
              >
                <option value="all">Toate categoriile</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}

          {/* Supplier select */}
          {suppliers.length > 0 && (
            <div className="relative">
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border bg-background
                           text-sm font-medium transition-colors cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-ring
                           text-muted-foreground hover:bg-accent"
              >
                <option value="all">Toți furnizorii</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Stock + expiry filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1 shrink-0">Stoc:</span>
          <FilterChip active={stockFilter === 'all'}  onClick={() => setStockFilter('all')}>Toate</FilterChip>
          <FilterChip active={stockFilter === 'out'}  onClick={() => setStockFilter('out')}  color="red">
            <XCircle className="w-3 h-3" />Epuizat {counts.out > 0 && <span className="ml-0.5 font-bold">({counts.out})</span>}
          </FilterChip>
          <FilterChip active={stockFilter === 'low'}  onClick={() => setStockFilter('low')}  color="amber">
            <AlertTriangle className="w-3 h-3" />Redus {counts.low > 0 && <span className="ml-0.5 font-bold">({counts.low})</span>}
          </FilterChip>
          <FilterChip active={stockFilter === 'ok'}   onClick={() => setStockFilter('ok')}   color="emerald">
            <Package2 className="w-3 h-3" />Normal
          </FilterChip>

          <span className="text-xs text-muted-foreground ml-3 mr-1 shrink-0">Expirare:</span>
          <FilterChip active={expiryFilter === 'all'}      onClick={() => setExpiryFilter('all')}>Toate</FilterChip>
          <FilterChip active={expiryFilter === 'expired'}  onClick={() => setExpiryFilter('expired')}  color="red">
            <CalendarX2 className="w-3 h-3" />Expirate {counts.expired > 0 && <span className="ml-0.5 font-bold">({counts.expired})</span>}
          </FilterChip>
          <FilterChip active={expiryFilter === 'expiring'} onClick={() => setExpiryFilter('expiring')} color="amber">
            <CalendarClock className="w-3 h-3" />Expiră curând {counts.expiring > 0 && <span className="ml-0.5 font-bold">({counts.expiring})</span>}
          </FilterChip>
        </div>

        {/* Results count + clear + export */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length === materials.length
                ? `${materials.length} material${materials.length !== 1 ? 'e' : ''}`
                : `${filtered.length} din ${materials.length} materiale`}
              {search && ` care corespund „${search}"`}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <XIcon className="w-3 h-3" />Șterge filtrele
              </button>
            )}
          </div>
          <ExportButton
            filename={`materiale-${new Date().toISOString().slice(0, 10)}`}
            rows={shapeMaterialRows(filtered)}
            disabled={filtered.length === 0}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Material','Categorie','Unitate','Cost/Unitate','Stoc','Prag Minim','Expirare','Furnizor','Acțiuni'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                         text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="p-3 rounded-full bg-muted/40">
                        <Package2 className="w-7 h-7 opacity-40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {hasFilters ? 'Niciun material nu corespunde filtrelor' : 'Niciun material înregistrat'}
                        </p>
                        <p className="text-xs mt-1">
                          {hasFilters ? 'Modificați filtrele pentru a vedea mai multe rezultate.' : 'Adăugați primul material folosind butonul de mai sus.'}
                        </p>
                      </div>
                      {hasFilters && (
                        <button onClick={clearAll} className="text-xs text-primary hover:underline">
                          Șterge toate filtrele
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(m => {
                const status    = getStockStatus(m)
                const badge     = STOCK_BADGE[status]
                const BadgeIcon = (badge as any).icon

                return (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">

                    {/* Name + SKU */}
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex items-start gap-2">
                        {!m.is_active && (
                          <ShieldOff className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" title="Inactiv" />
                        )}
                        <div className="min-w-0">
                          <p className={`font-medium truncate ${!m.is_active ? 'text-muted-foreground line-through' : ''}`}>
                            {m.name}
                          </p>
                          {m.sku && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{m.sku}</p>
                          )}
                          {m.location && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {m.location}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      {m.categories ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={m.categories.color ? {
                            backgroundColor: m.categories.color + '18',
                            borderColor:     m.categories.color + '44',
                            color:           m.categories.color,
                          } : {}}
                        >
                          {m.categories.name}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.unit}</td>

                    {/* Cost */}
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(m.cost_per_unit))}</td>

                    {/* Stock + badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`tabular-nums font-semibold ${
                          status === 'out' ? 'text-red-600' :
                          status === 'low' ? 'text-amber-600' : ''
                        }`}>
                          {Number(m.quantity)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${badge.classes}`}>
                          {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                          {badge.label}
                        </span>
                      </div>
                      {/* Mini progress bar when low */}
                      {status === 'low' && Number(m.min_threshold) > 0 && (
                        <div className="mt-1 h-1 rounded-full bg-amber-100 overflow-hidden w-20">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.min((Number(m.quantity)/Number(m.min_threshold))*100,100)}%` }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Min threshold */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {Number(m.min_threshold) > 0 ? m.min_threshold : '—'}
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3">
                      <ExpiryCell expiry_date={m.expiry_date} />
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[140px]">
                      <span className="truncate block">{m.suppliers?.name ?? '—'}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <EditMaterialDialog material={m} categories={categories} suppliers={suppliers} />
                        <DeleteMaterialButton materialId={m.id} materialName={m.name} />
                      </div>
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
