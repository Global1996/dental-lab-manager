'use client'
// src/components/stock/StockAdjustmentDialog.tsx
// Records a stock count correction (stocktake result, data-entry fix, etc.)
// The user enters a signed delta: +10 to add, -5 to remove.
// A live preview shows the resulting quantity before submitting.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { SlidersHorizontal, Loader2, X, ArrowRight, AlertTriangle } from 'lucide-react'
import { stockAdjustmentSchema, stockAdjustmentDefaults, type StockAdjustmentValues } from './stockSchema'
import { recordAdjustment } from './stockActions'
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/FormField'
import type { MaterialWithJoins } from '@/types'

interface Props {
  materials: MaterialWithJoins[]
}

export function StockAdjustmentDialog({ materials }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm<StockAdjustmentValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: stockAdjustmentDefaults,
  })

  const selectedMaterialId = watch('material_id')
  const delta              = watch('delta')
  const selectedMaterial   = materials.find(m => m.id === selectedMaterialId)
  const current            = Number(selectedMaterial?.quantity ?? 0)
  const resulting          = current + Number(delta || 0)
  const wouldGoNegative    = resulting < 0

  async function onSubmit(values: StockAdjustmentValues) {
    const result = await recordAdjustment(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Ajustare stoc înregistrată', { description: `${selectedMaterial?.name ?? ''}: ${Number(values.delta) > 0 ? '+' : ''}${Number(values.delta)} ${selectedMaterial?.unit ?? ''}` })
    reset(stockAdjustmentDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(stockAdjustmentDefaults)
    setOpen(false)
  }

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.name}${m.sku ? ` · ${m.sku}` : ''}`,
  }))

  const deltaNum = Number(delta || 0)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2
                   text-sm font-medium shadow-sm hover:bg-accent transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Ajustare
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="adj-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 id="adj-title" className="text-base font-semibold flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-md bg-blue-100">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-700" />
                  </span>
                  Ajustare Stoc
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Corectare stoc după inventariere sau eroare de date
                </p>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="px-6 py-5 space-y-4">

                {/* Material */}
                <FieldWrapper label="Material" htmlFor="adj_material" required error={errors.material_id?.message}>
                  <Select
                    {...register('material_id')}
                    id="adj_material"
                    placeholder="— Selectează materialul —"
                    options={materialOptions}
                    error={!!errors.material_id}
                  />
                </FieldWrapper>

                {/* Live before → after preview */}
                {selectedMaterial && (
                  <div className={`rounded-lg border px-4 py-3 flex items-center gap-3
                    ${wouldGoNegative
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-border bg-muted/40'}`}>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">Curent</p>
                      <p className="text-lg font-bold tabular-nums">{current}</p>
                      <p className="text-xs text-muted-foreground">{selectedMaterial.unit}</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      {deltaNum !== 0 && (
                        <span className={`text-xs font-semibold tabular-nums mt-0.5
                          ${deltaNum > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {deltaNum > 0 ? `+${deltaNum}` : deltaNum}
                        </span>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">Rezultat</p>
                      <p className={`text-lg font-bold tabular-nums
                        ${wouldGoNegative ? 'text-destructive' : deltaNum !== 0 ? 'text-primary' : ''}`}>
                        {resulting}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedMaterial.unit}</p>
                    </div>
                  </div>
                )}

                {/* Negative stock warning */}
                {wouldGoNegative && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40
                                  bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>Această ajustare ar aduce stocul sub zero, ceea ce nu este permis.</span>
                  </div>
                )}

                {/* Delta input */}
                <FieldWrapper
                  label="Cantitate ajustare"
                  htmlFor="adj_delta"
                  required
                  error={errors.delta?.message}
                  hint="Pozitiv pentru a adăuga (+10), negativ pentru a elimina (−5)"
                >
                  <Input
                    {...register('delta', { valueAsNumber: true })}
                    id="adj_delta"
                    type="number"
                    step="0.0001"
                    placeholder="+10 sau −5"
                    error={!!errors.delta || wouldGoNegative}
                  />
                </FieldWrapper>

                {/* Reason — required for audits */}
                <FieldWrapper label="Motiv" htmlFor="adj_reason" required error={errors.reason?.message}
                  hint="Obligatoriu — creează o pistă de audit">
                  <Input {...register('reason')} id="adj_reason"
                    placeholder="ex. Corecție inventar, stoc avariat scos din gestiune…"
                    error={!!errors.reason} />
                </FieldWrapper>

                {/* Notes */}
                <FieldWrapper label="Notițe suplimentare" htmlFor="adj_notes" error={errors.notes?.message}>
                  <Textarea {...register('notes')} id="adj_notes"
                    placeholder="Detalii opționale…" rows={2} />
                </FieldWrapper>

              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || wouldGoNegative}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground
                             text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Se salvează…' : 'Înregistrează Ajustare'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
