'use client'
// src/components/cases/MaterialUsageTable.tsx
// Shows materials assigned to a case.
// Each row: material name, SKU, quantity, unit cost snapshot, line total, notes, remove button.
// Foot row: total material cost.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertCircle, Package2 } from 'lucide-react'
import { fmtCurrency, calcLineCost } from '@/components/calculator/calcUtils'
import { removeMaterialFromCase } from './caseActions'
import type { CaseMaterialUsage } from '@/types'

interface Props {
  caseId:   string
  usages:   CaseMaterialUsage[]
  editable: boolean
}

function RemoveButton({
  caseId, usageId, materialName,
}: {
  caseId: string; usageId: string; materialName: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const result = await removeMaterialFromCase(caseId, usageId)
      if (!result.success) { toast.error(result.error); return }
      toast.success("Material eliminat din caz", { description: `${materialName} — stocul NU este returnat automat.` })
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}
        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground
                   hover:text-destructive transition-colors"
        title="Elimină materialul din caz">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs whitespace-nowrap">
      <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
      <span className="text-destructive font-medium">Eliminați?</span>
      <button onClick={handleRemove} disabled={isPending}
        className="ml-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground
                   font-medium hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-1">
        {isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
        Da
      </button>
      <button onClick={() => setConfirming(false)} disabled={isPending}
        className="px-2 py-0.5 rounded border font-medium hover:bg-accent disabled:opacity-50">
        Nu
      </button>
    </div>
  )
}

export function MaterialUsageTable({ caseId, usages, editable }: Props) {
  if (usages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <Package2 className="w-8 h-8 text-muted-foreground/25 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Niciun material atribuit</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {editable
            ? 'Folosiți "Adaugă Material" pentru a atribui materiale din inventar. Stocul se deduce și costurile se calculează automat.'
            : 'Niciun material nu a fost înregistrat pentru acest caz.'}
        </p>
      </div>
    )
  }

  const grandTotal = usages.reduce((sum, u) => sum + calcLineCost(Number(u.quantity_used), Number(u.unit_cost_at_time)), 0)

  const cols = ['Material', 'SKU', 'Cant.', 'Cost Unitar (snapshot)', 'Total Linie', 'Observații']
  if (editable) cols.push('')

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              {cols.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                       text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {usages.map(u => {
              const lineTotal = calcLineCost(Number(u.quantity_used), Number(u.unit_cost_at_time))
              return (
                <tr key={u.id}
                  className="border-b last:border-0 hover:bg-muted/20 transition-colors">

                  {/* Material */}
                  <td className="px-4 py-3 font-medium max-w-[200px]">
                    <span className="block truncate">{u.materials?.name ?? 'Necunoscut'}</span>
                  </td>

                  {/* SKU */}
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {u.materials?.sku ?? '—'}
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                    {Number(u.quantity_used)} {u.materials?.unit ?? ''}
                  </td>

                  {/* Unit cost snapshot */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="tabular-nums text-muted-foreground">
                      {fmtCurrency(Number(u.unit_cost_at_time))}
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground/60
                                     bg-muted px-1.5 py-0.5 rounded font-mono">
                      snapshot
                    </span>
                  </td>

                  {/* Line total */}
                  <td className="px-4 py-3 tabular-nums font-semibold whitespace-nowrap">
                    {fmtCurrency(lineTotal)}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px]">
                    <span className="block truncate text-xs" title={u.notes ?? ''}>
                      {u.notes ?? '—'}
                    </span>
                  </td>

                  {/* Remove */}
                  {editable && (
                    <td className="px-4 py-3">
                      <RemoveButton
                        caseId={caseId}
                        usageId={u.id}
                        materialName={u.materials?.name ?? 'material'}
                      />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>

          {/* Total row */}
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-right">
                Cost Total Materiale
              </td>
              <td className="px-4 py-3 tabular-nums font-bold text-base">
                {fmtCurrency(grandTotal)}
              </td>
              <td colSpan={editable ? 2 : 1} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
