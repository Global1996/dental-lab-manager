'use client'
// src/components/stock/StockInDialog.tsx
// Records receipt of new stock from a supplier.
// Fields: material, quantity, unit cost (price paid), batch number,
//         expiry date (for materials with has_expiry), reason, notes.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowDownToLine, Loader2, X } from 'lucide-react'
import { stockInSchema, stockInDefaults, type StockInValues } from './stockSchema'
import { recordStockIn } from './stockActions'
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/FormField'
import type { MaterialWithStock } from '@/types'

interface Props {
  materials: MaterialWithStock[]
}

export function StockInDialog({ materials }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<StockInValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: stockInDefaults,
  })

  const selectedMaterialId = watch('material_id')
  const selectedMaterial   = materials.find(m => m.id === selectedMaterialId)

  async function onSubmit(values: StockInValues) {
    const result = await recordStockIn(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Stock received and recorded')
    reset(stockInDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(stockInDefaults)
    setOpen(false)
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name}${m.sku ? ` · ${m.sku}` : ''}`,
  }))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2
                   text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
      >
        <ArrowDownToLine className="w-4 h-4" />
        Stock In
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="stock-in-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 id="stock-in-title" className="text-base font-semibold flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-md bg-emerald-100">
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-700" />
                  </span>
                  Record Stock In
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">New stock received from supplier</p>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="px-6 py-5 space-y-4">

                {/* Material */}
                <FieldWrapper label="Material" htmlFor="si_material" required error={errors.material_id?.message}>
                  <Select
                    {...register('material_id')}
                    id="si_material"
                    placeholder="— Select material —"
                    options={materialOptions}
                    error={!!errors.material_id}
                  />
                </FieldWrapper>

                {/* Current stock info */}
                {selectedMaterial && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
                    <span>
                      Current stock:{' '}
                      <strong className="text-foreground">
                        {selectedMaterial.stock_levels?.total_quantity ?? 0} {selectedMaterial.unit}
                      </strong>
                    </span>
                    <span>
                      Min threshold:{' '}
                      <strong className="text-foreground">{selectedMaterial.reorder_level}</strong>
                    </span>
                  </div>
                )}

                {/* Quantity + Unit cost */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper label={`Quantity${selectedMaterial ? ` (${selectedMaterial.unit})` : ''}`}
                    htmlFor="si_qty" required error={errors.quantity?.message}>
                    <Input {...register('quantity', { valueAsNumber: true })}
                      id="si_qty" type="number" step="0.0001" min="0.0001"
                      placeholder="0" error={!!errors.quantity} />
                  </FieldWrapper>

                  <FieldWrapper label="Unit cost ($)" htmlFor="si_cost"
                    hint="What you paid per unit" error={errors.unit_cost?.message}>
                    <Input {...register('unit_cost', { valueAsNumber: true, setValueAs: v => v === '' ? null : Number(v) })}
                      id="si_cost" type="number" step="0.0001" min="0"
                      placeholder="0.00" error={!!errors.unit_cost} />
                  </FieldWrapper>
                </div>

                {/* Batch number + Expiry date */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper label="Batch / Lot number" htmlFor="si_batch"
                    error={errors.batch_number?.message}>
                    <Input {...register('batch_number')}
                      id="si_batch" placeholder="e.g. LOT-2024-01" />
                  </FieldWrapper>

                  {(selectedMaterial?.has_expiry || true) && (
                    <FieldWrapper label="Expiry date" htmlFor="si_expiry"
                      error={errors.expiry_date?.message}>
                      <Input {...register('expiry_date')}
                        id="si_expiry" type="date" />
                    </FieldWrapper>
                  )}
                </div>

                {/* Reason */}
                <FieldWrapper label="Reason / Reference" htmlFor="si_reason"
                  hint="e.g. PO #1234, supplier delivery" error={errors.reason?.message}>
                  <Input {...register('reason')} id="si_reason"
                    placeholder="Supplier delivery, PO reference…" />
                </FieldWrapper>

                {/* Notes */}
                <FieldWrapper label="Additional notes" htmlFor="si_notes"
                  error={errors.notes?.message}>
                  <Textarea {...register('notes')} id="si_notes"
                    placeholder="Optional details…" rows={2} />
                </FieldWrapper>

              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white
                             text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Saving…' : 'Record Stock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
