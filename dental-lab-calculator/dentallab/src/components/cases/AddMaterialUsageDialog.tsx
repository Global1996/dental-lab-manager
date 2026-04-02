'use client'
// src/components/cases/AddMaterialUsageDialog.tsx
// Adds a material line to a case.
//
// Key behaviours:
//   1. Selects from active inventory materials with current qty shown in dropdown.
//   2. On material selection, shows unit cost, available qty, and a live line total.
//   3. Blocks submission (and warns) if requested qty > available stock.
//   4. On submit: server action snapshots cost_per_unit as unit_cost_at_time,
//      inserts case_material_usage, DB trigger creates stock_movements row,
//      DB trigger rolls up material_cost on the parent case.
//   5. After success: calls onSuccess() so parent can refresh its state.

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Loader2, X, AlertTriangle, Package2, Info } from 'lucide-react'
import { addMaterialUsageSchema, type AddMaterialUsageValues } from './caseSchema'
import { addMaterialToCase } from './caseActions'
import { FieldWrapper, Input, Textarea } from '@/components/ui/FormField'
import { calcLineCost, fmtCurrency } from '@/components/calculator/calcUtils'
import { cn } from '@/lib/utils'
import type { MaterialWithStock } from '@/types'

interface Props {
  caseId:    string
  materials: MaterialWithStock[]
  onSuccess?: () => void
}

const defaults: AddMaterialUsageValues = {
  material_id:   '',
  quantity_used: 1,
  notes:         null,
}

export function AddMaterialUsageDialog({ caseId, materials, onSuccess }: Props) {
  const [open, setOpen]           = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { register, handleSubmit, reset, watch, setValue,
          formState: { errors, isSubmitting } } =
    useForm<AddMaterialUsageValues>({
      resolver: zodResolver(addMaterialUsageSchema),
      defaultValues: defaults,
    })

  const selectedId = watch('material_id')
  const enteredQty = watch('quantity_used')
  const selected   = materials.find(m => m.id === selectedId)
  const available  = selected ? Number(selected.quantity) : 0
  const qty        = Number(enteredQty) || 0
  const lineCost   = selected ? calcLineCost(qty, Number(selected.cost_per_unit)) : 0
  const wouldExceed = !!selected && qty > available
  const isOutOfStock = !!selected && available <= 0

  // Filtered material list for the search box
  const filteredMaterials = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.sku ?? '').toLowerCase().includes(q)
    )
  }, [materials, searchTerm])

  async function onSubmit(values: AddMaterialUsageValues) {
    if (wouldExceed) {
      toast.error(`Only ${available} ${selected?.unit} in stock.`)
      return
    }
    const result = await addMaterialToCase(caseId, values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Material added — stock deducted automatically')
    reset(defaults)
    setSearchTerm('')
    setOpen(false)
    onSuccess?.()
  }

  function handleClose() {
    if (isSubmitting) return
    reset(defaults)
    setSearchTerm('')
    setOpen(false)
  }

  function selectMaterial(id: string) {
    setValue('material_id', id, { shouldValidate: true })
    setValue('quantity_used', 1)
    setSearchTerm('')
  }

  return (
    <>
      {/* Trigger */}
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5
                   text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="w-3.5 h-3.5" />
        Add Material
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="amu-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-background shadow-2xl
                          flex flex-col max-h-[90vh]">

            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 id="amu-title" className="text-base font-semibold">Add Material to Case</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cost snapshotted now · Stock deducted on save
                </p>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col overflow-hidden">
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

                {/* ── Material search + picker ────────────────────── */}
                <FieldWrapper label="Material" htmlFor="amu_search" required
                  error={errors.material_id?.message}>

                  {/* Search input */}
                  <div className="relative">
                    <input
                      id="amu_search"
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search by name or SKU…"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm
                                 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Hidden real field for react-hook-form */}
                  <input type="hidden" {...register('material_id')} />

                  {/* Material list */}
                  <div className="border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                    {filteredMaterials.length === 0 ? (
                      <div className="flex flex-col items-center gap-1 py-6 text-muted-foreground">
                        <Package2 className="w-5 h-5 opacity-40" />
                        <p className="text-xs">No materials match</p>
                      </div>
                    ) : filteredMaterials.map(m => {
                      const isSelected = m.id === selectedId
                      const qty        = Number(m.quantity)
                      const isOut      = qty <= 0
                      const isLow      = qty > 0 && qty <= Number(m.min_threshold)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => selectMaterial(m.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 text-left',
                            'border-b last:border-0 transition-colors text-sm',
                            isSelected
                              ? 'bg-primary/10 border-primary/20'
                              : 'hover:bg-muted/50',
                            isOut && !isSelected && 'opacity-50'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{m.name}</p>
                            {m.sku && (
                              <p className="text-xs text-muted-foreground font-mono">{m.sku}</p>
                            )}
                          </div>
                          <div className="ml-3 text-right shrink-0">
                            <p className="text-xs font-semibold">{fmtCurrency(Number(m.cost_per_unit))}/{m.unit}</p>
                            <p className={cn(
                              'text-xs',
                              isOut  ? 'text-red-600 font-semibold' :
                              isLow  ? 'text-amber-600 font-semibold' :
                              'text-muted-foreground'
                            )}>
                              {isOut ? 'Out of stock' : `${qty} ${m.unit} available`}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </FieldWrapper>

                {/* ── Selected material info strip ─────────────────── */}
                {selected && (
                  <div className={cn(
                    'rounded-lg border px-4 py-3 space-y-2 text-xs',
                    wouldExceed ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/40'
                  )}>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Unit Cost</p>
                        <p className="font-bold text-sm">{fmtCurrency(Number(selected.cost_per_unit))}</p>
                        <p className="text-muted-foreground text-xs">per {selected.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">In Stock</p>
                        <p className={cn('font-bold text-sm',
                          isOutOfStock ? 'text-red-600' :
                          available <= Number(selected.min_threshold) ? 'text-amber-600' :
                          'text-emerald-600'
                        )}>{available}</p>
                        <p className="text-muted-foreground text-xs">{selected.unit}</p>
                      </div>
                      <div className={cn(
                        'rounded-lg p-1',
                        wouldExceed ? 'bg-destructive/10' : 'bg-primary/5'
                      )}>
                        <p className="text-muted-foreground mb-0.5">Line Total</p>
                        <p className={cn('font-bold text-sm',
                          wouldExceed ? 'text-destructive' : 'text-primary'
                        )}>{fmtCurrency(lineCost)}</p>
                        <p className="text-muted-foreground text-xs">
                          {qty > 0 ? `${qty} × ${fmtCurrency(Number(selected.cost_per_unit))}` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Exceed warning */}
                    {wouldExceed && (
                      <div className="flex items-start gap-1.5 text-destructive">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>
                          Only <strong>{available} {selected.unit}</strong> available.
                          Reduce the quantity to proceed.
                        </span>
                      </div>
                    )}

                    {/* Snapshot note */}
                    {!wouldExceed && (
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>Unit cost is snapshotted at save time. Future price changes won't affect this case.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Quantity ─────────────────────────────────────── */}
                <FieldWrapper
                  label={selected ? `Quantity (${selected.unit})` : 'Quantity'}
                  htmlFor="amu_qty"
                  required
                  error={errors.quantity_used?.message}>
                  <Input
                    {...register('quantity_used', { valueAsNumber: true })}
                    id="amu_qty"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="1"
                    error={!!errors.quantity_used || wouldExceed}
                  />
                </FieldWrapper>

                {/* ── Notes ────────────────────────────────────────── */}
                <FieldWrapper label="Notes (optional)" htmlFor="amu_notes" error={errors.notes?.message}>
                  <Textarea
                    {...register('notes')}
                    id="amu_notes"
                    placeholder="Shade variant, partial usage, special notes…"
                    rows={2}
                  />
                </FieldWrapper>

              </div>

              {/* ── Footer ────────────────────────────────────────── */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedId || wouldExceed || isOutOfStock}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary
                             text-primary-foreground text-sm font-medium hover:bg-primary/90
                             transition-colors disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Adding…' :
                   selectedId && qty > 0 ? `Add · ${fmtCurrency(lineCost)}` : 'Add to Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
