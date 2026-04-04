'use client'
import React from 'react'
// src/components/purchase-orders/PurchaseOrdersTable.tsx
// List of purchase orders with search, status filter, and expandable detail rows.

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { SearchInput }   from '@/components/ui/SearchInput'
import { PoStatusBadge } from './PoStatusBadge'
import { PoDetailPanel } from './PoDetailPanel'
import { PO_STATUS_OPTIONS, type PoStatus } from './poSchema'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PurchaseOrder, PurchaseOrderItem } from '@/types'

interface OrderWithDetails extends PurchaseOrder {
  suppliers?: { name: string; contact_name: string | null; email: string | null; phone: string | null } | null
  item_count: number
  items: PurchaseOrderItem[]
}

interface Props {
  orders: OrderWithDetails[]
}

export function PurchaseOrdersTable({ orders }: Props) {
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<PoStatus | 'all'>('all')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (!q) return true
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.suppliers?.name ?? '').toLowerCase().includes(q) ||
        (o.notes ?? '').toLowerCase().includes(q) ||
        o.items.some(i => i.material_name.toLowerCase().includes(q))
      )
    })
  }, [orders, search, statusFilter])

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  // Count per status for filter chips
  const counts = useMemo(() => {
    const m: Partial<Record<PoStatus, number>> = {}
    for (const o of orders) m[o.status] = (m[o.status] ?? 0) + 1
    return m
  }, [orders])

  return (
    <div className="space-y-4">

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Caută după număr, furnizor sau material…"
            className="flex-1 min-w-[220px] max-w-sm"
          />
        </div>

        {/* Status chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...PO_STATUS_OPTIONS.map(o => o.value)] as const).map(s => {
            const active = statusFilter === s
            const count  = s === 'all'
              ? orders.length
              : (counts[s as PoStatus] ?? 0)
            if (s !== 'all' && count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s as PoStatus | 'all')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent text-muted-foreground'
                )}
              >
                {s === 'all'
                  ? 'Toate'
                  : PO_STATUS_OPTIONS.find(o => o.value === s)?.label}
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                  active ? 'bg-primary/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          {filtered.length === orders.length
            ? `${orders.length} comand${orders.length === 1 ? 'ă' : 'ă'} de achiziție`
            : `${filtered.length} din ${orders.length} comenzi de achiziție`}
        </p>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/40">
              <ClipboardList className="w-7 h-7 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {search || statusFilter !== 'all'
                  ? 'Nicio comandă nu corespunde filtrelor'
                  : 'Nicio comandă de achiziție înregistrată'}
              </p>
              <p className="text-xs mt-1">
                {search || statusFilter !== 'all'
                  ? 'Modificați filtrele pentru mai multe rezultate.'
                  : 'Creați prima comandă folosind butonul de mai sus.'}
              </p>
            </div>
            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all') }}
                className="text-xs text-primary hover:underline"
              >
                Șterge filtrele
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['', 'Număr', 'Furnizor', 'Data', 'Status', 'Materiale', 'Livrare estimată'].map(h => (
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
              {filtered.map(order => {
                const isExpanded = expandedId === order.id
                return (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className="border-b hover:bg-muted/20 transition-colors cursor-pointer group"
                    >
                      {/* Expand toggle */}
                      <td className="px-3 py-3 w-8">
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        }
                      </td>

                      {/* Order number */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {order.order_number}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="truncate block font-medium">
                          {order.suppliers?.name ?? (
                            <span className="text-muted-foreground italic">Fără furnizor</span>
                          )}
                        </span>
                      </td>

                      {/* Order date */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(order.order_date)}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <PoStatusBadge status={order.status} />
                      </td>

                      {/* Item count */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.item_count} {order.item_count === 1 ? 'material' : 'materiale'}
                      </td>

                      {/* Expected date */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {order.expected_date ? formatDate(order.expected_date) : '—'}
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isExpanded && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} className="p-0">
                          <PoDetailPanel
                            order={order}
                            items={order.items}
                            onClose={() => setExpandedId(null)}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
