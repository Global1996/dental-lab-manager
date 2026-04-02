'use client'
// src/components/stock/StockOutDialog.tsx
// Records manual stock consumption (not linked to a case).
// Shows the current stock level and blocks submission if quantity > available.
// The DB trigger enforces this too, but we give early feedback in the UI.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowUpFromLine, Loader2, X, AlertTriangle } from 'lucide-react'
import { stockOutSchema, stockOutDefaults, type StockOutValues } from './stockSchema'
import { recordStockOut } from './stockActions'
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/FormField'
import type { MaterialWithStock } from '@/types'

interface CaseOption { id: string; case_number: string; patient_name: string }

interface Props {
  materials: MaterialWithStock[]
  cases?:    CaseOption[]
}

export function StockOutDialog({ materials, cases = [] }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<StockOutValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: stockOutDefaults,
  })

  const selectedMaterialId = watch('material_id')
  const selectedQty        = watch('quantity')
  const selectedMaterial   = materials.find(m => m.id === selectedMaterialId)
  const available          = selectedMaterial?.stock_levels?.total_quantity ?? 0
  const wouldGoNegative    = selectedMaterial && Number(selectedQty) > available

  async function onSubmit(values: StockOutValues) {
    const result = await recordStockOut(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Stock out recorded')
    reset(stockOutDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(stockOutDefaults)
    setOpen(false)
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name}${m.sku ? ` · ${m.sku}` : ''} (${m.stock_levels?.total_quantity ?? 0} ${m.unit})`,
  }))

  const caseOptions = cases.map(c => ({
    value: c.id,
    label: `${c.case_number} — ${c.patient_name}`,
  }))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2
                   text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
      >
        <ArrowUpFromLine className="w-4 h-4" />
        Stock Out
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="stock-out-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 id="stock-out-title" className="text-base font-semibold flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-md bg-red-100">
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-red-700" />
                  </span>
                  Record Stock Out
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manual stock consumption or removal</p>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="px-6 py-5 space-y-4">

                {/* Material */}
                <FieldWrapper label="Material" htmlFor="so_material" required error={errors.material_id?.message}>
                  <Select
                    {...register('material_id')}
                    id="so_material"
                    placeholder="— Select material —"
                    options={materialOptions}
                    error={!!errors.material_id}
                  />
                </FieldWrapper>

                {/* Stock warning */}
                {wouldGoNegative && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40
                                  bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Only <strong>{available} {selectedMaterial?.unit}</strong> available.
                      This quantity would bring stock below zero.
                    </span>
                  </div>
                )}

                {/* Quantity */}
                <FieldWrapper
                  label={`Quantity${selectedMaterial ? ` (${selectedMaterial.unit})` : ''}`}
                  htmlFor="so_qty"
                  required
                  error={errors.quantity?.message}
                  hint={selectedMaterial ? `Available: ${available} ${selectedMaterial.unit}` : undefined}
                >
                  <Input
                    {...register('quantity', { valueAsNumber: true })}
                    id="so_qty"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max={available || undefined}
                    placeholder="0"
                    error={!!errors.quantity || !!wouldGoNegative}
                  />
                </FieldWrapper>

                {/* Link to case (optional) */}
                {cases.length > 0 && (
                  <FieldWrapper label="Link to case (optional)" htmlFor="so_case"
                    hint="Associate this usage with a specific work order"
                    error={errors.case_id?.message}>
                    <Select
                      {...register('case_id')}
                      id="so_case"
                      placeholder="— Not linked to a case —"
                      options={caseOptions}
                      error={!!errors.case_id}
                    />
                  </FieldWrapper>
                )}

                {/* Reason */}
                <FieldWrapper label="Reason" htmlFor="so_reason"
                  hint="Why is this stock being removed?" error={errors.reason?.message}>
                  <Input {...register('reason')} id="so_reason"
                    placeholder="e.g. Damaged, used for testing, discarded…" />
                </FieldWrapper>

                {/* Notes */}
                <FieldWrapper label="Additional notes" htmlFor="so_notes" error={errors.notes?.message}>
                  <Textarea {...register('notes')} id="so_notes"
                    placeholder="Optional details…" rows={2} />
                </FieldWrapper>

              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!wouldGoNegative}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white
                             text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Saving…' : 'Record Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
