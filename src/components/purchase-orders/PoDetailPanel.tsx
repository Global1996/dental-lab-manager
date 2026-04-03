'use client'
// src/components/purchase-orders/PoDetailPanel.tsx
// Expanded row detail — shows line items, supplier info, and action buttons.
// Rendered inline below the list row when the user clicks to expand.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  CheckCircle2, XCircle, PackageCheck, Loader2,
  Calendar, Truck, FileText, AlertTriangle,
} from 'lucide-react'
import { PoStatusBadge } from './PoStatusBadge'
import { updatePoStatus, receiveOrderAndUpdateStock, deletePurchaseOrder } from './poActions'
import { PO_STATUS_OPTIONS, type PoStatus } from './poSchema'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { PurchaseOrder, PurchaseOrderItem } from '@/types'

interface Props {
  order:  PurchaseOrder & {
    suppliers?: { name: string; contact_name: string | null; email: string | null; phone: string | null } | null
  }
  items:  PurchaseOrderItem[]
  onClose: () => void
}

export function PoDetailPanel({ order, items, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  // Whether user wants stock updated when receiving
  const [updateStock, setUpdateStock] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const canAdvance  = order.status === 'draft' || order.status === 'ordered'
  const canReceive  = order.status === 'ordered'
  const canCancel   = order.status === 'draft' || order.status === 'ordered'
  const canDelete   = order.status === 'draft'
  const isReceived  = order.status === 'received'
  const isCancelled = order.status === 'cancelled'

  // Items that are linked to a real material (can update stock)
  const linkedItems = items.filter(i => i.material_id !== null)

  const totalValue = items.reduce((sum, item) => {
    if (!item.unit_cost) return sum
    return sum + Number(item.unit_cost) * Number(item.quantity_ordered)
  }, 0)

  function handleStatusChange(newStatus: PoStatus) {
    startTransition(async () => {
      const result = await updatePoStatus(order.id, newStatus)
      if (!result.success) { toast.error(result.error); return }
      const label = PO_STATUS_OPTIONS.find(o => o.value === newStatus)?.label ?? newStatus
      toast.success(`Status actualizat: ${label}`)
    })
  }

  function handleReceive() {
    startTransition(async () => {
      if (updateStock && linkedItems.length > 0) {
        const result = await receiveOrderAndUpdateStock(order.id)
        if (!result.success) { toast.error(result.error); return }
        toast.success('Comandă recepționată', {
          description: `Stocul a fost actualizat pentru ${linkedItems.length} material${linkedItems.length !== 1 ? 'e' : ''}.`,
        })
      } else {
        const result = await updatePoStatus(order.id, 'received')
        if (!result.success) { toast.error(result.error); return }
        toast.success('Comandă marcată ca recepționată')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePurchaseOrder(order.id)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Comandă ștearsă')
      onClose()
    })
  }

  return (
    <div className="border-t bg-muted/20 px-4 py-5 space-y-5">

      {/* ── Info row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">

        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Data comenzii</p>
            <p className="font-medium">{formatDate(order.order_date)}</p>
          </div>
        </div>

        {order.expected_date && (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Livrare estimată</p>
              <p className="font-medium">{formatDate(order.expected_date)}</p>
            </div>
          </div>
        )}

        {order.received_date && (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Data recepției</p>
              <p className="font-medium text-emerald-700">{formatDate(order.received_date)}</p>
            </div>
          </div>
        )}

        {order.suppliers && (
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Furnizor</p>
              <p className="font-medium">{order.suppliers.name}</p>
              {order.suppliers.contact_name && (
                <p className="text-xs text-muted-foreground">{order.suppliers.contact_name}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 border px-3 py-2">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* ── Line items table ──────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {['Material', 'Unitate', 'Cantitate', 'Preț unitar', 'Total', 'Observații'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold
                                       text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Niciun material în această comandă.
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-muted/10">
                <td className="px-4 py-2.5 font-medium max-w-[200px]">
                  <span className="block truncate">{item.material_name}</span>
                  {item.material_id === null && (
                    <span className="text-xs text-amber-600 font-normal">
                      (material neconectat)
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                  {item.unit}
                </td>
                <td className="px-4 py-2.5 tabular-nums font-semibold">
                  {Number(item.quantity_ordered)}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                  {item.unit_cost ? formatCurrency(Number(item.unit_cost)) : '—'}
                </td>
                <td className="px-4 py-2.5 tabular-nums font-medium">
                  {item.unit_cost
                    ? formatCurrency(Number(item.unit_cost) * Number(item.quantity_ordered))
                    : '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[160px]">
                  <span className="block truncate">{item.notes ?? '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
          {totalValue > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/20">
                <td colSpan={4} className="px-4 py-2.5 text-right text-sm font-semibold">
                  Total estimat
                </td>
                <td className="px-4 py-2.5 tabular-nums font-bold">
                  {formatCurrency(totalValue)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      {!isReceived && !isCancelled && (
        <div className="flex flex-wrap items-center gap-3">

          {/* Draft → Ordered */}
          {order.status === 'draft' && (
            <button
              disabled={isPending}
              onClick={() => handleStatusChange('ordered')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-blue-600 text-white text-sm font-medium
                         hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Marchează ca Trimisă
            </button>
          )}

          {/* Ordered → Received */}
          {canReceive && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Stock update toggle */}
              {linkedItems.length > 0 && (
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateStock}
                    onChange={e => setUpdateStock(e.target.checked)}
                    className="h-4 w-4 rounded border accent-primary cursor-pointer"
                  />
                  <span>
                    Actualizează stocul
                    <span className="text-xs text-muted-foreground ml-1">
                      ({linkedItems.length} material{linkedItems.length !== 1 ? 'e' : ''})
                    </span>
                  </span>
                </label>
              )}

              <button
                disabled={isPending}
                onClick={handleReceive}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                           bg-emerald-600 text-white text-sm font-medium
                           hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <PackageCheck className="w-3.5 h-3.5" />}
                Marchează ca Recepționată
              </button>
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <button
              disabled={isPending}
              onClick={() => handleStatusChange('cancelled')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                         border text-sm font-medium text-muted-foreground
                         hover:bg-accent transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Anulează comanda
            </button>
          )}
        </div>
      )}

      {/* Received confirmation */}
      {isReceived && (
        <div className="flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">Recepționată</span>
          {order.received_date && (
            <span className="text-muted-foreground">pe {formatDate(order.received_date)}</span>
          )}
        </div>
      )}

      {/* Delete (drafts only) */}
      {canDelete && (
        <div className="border-t pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-destructive/70 hover:text-destructive transition-colors"
            >
              Șterge această schiță
            </button>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive font-medium">
                Ești sigur? Aceasta va șterge definitiv comanda și toate liniile sale.
              </span>
              <button
                disabled={isPending}
                onClick={handleDelete}
                className="px-3 py-1 rounded-lg bg-destructive text-destructive-foreground
                           text-xs font-medium hover:bg-destructive/90 disabled:opacity-50
                           inline-flex items-center gap-1"
              >
                {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Da, șterge
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-lg border text-xs font-medium hover:bg-accent"
              >
                Anulează
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
