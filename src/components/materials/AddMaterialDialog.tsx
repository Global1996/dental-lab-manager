'use client'
// src/components/materials/AddMaterialDialog.tsx
// The <form> wraps both the body AND footer so the submit button inside
// DialogFooter actually submits the form.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
import { materialSchema, materialDefaults, type MaterialFormValues } from './materialSchema'
import { createMaterial } from './materialActions'
import { MaterialForm } from './MaterialForm'
import type { Category, Supplier } from '@/types'

interface Props {
  categories: Category[]
  suppliers:  Supplier[]
}

export function AddMaterialDialog({ categories, suppliers }: Props) {
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } =
    useForm<MaterialFormValues>({
      resolver: zodResolver(materialSchema),
      defaultValues: materialDefaults,
    })

  async function onSubmit(values: MaterialFormValues) {
    const result = await createMaterial(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Material adăugat', { description: values.name })
    reset(materialDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(materialDefaults)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                   text-sm font-medium text-primary-foreground shadow-sm
                   hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adaugă Material
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="add-mat-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          {/* The <form> wraps the entire panel so the footer submit button works */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col
                       rounded-2xl border bg-background shadow-2xl overflow-hidden"
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 id="add-mat-title" className="text-base font-semibold">Adaugă Material</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Element nou în catalogul de materiale</p>
              </div>
              <button type="button" onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <MaterialForm register={register} errors={errors}
                categories={categories} suppliers={suppliers} />
            </div>

            {/* Sticky footer — submit button is inside the form */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30 shrink-0">
              <button type="button" onClick={handleClose} disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                Anulează
              </button>
              <button type="submit" disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary
                           text-primary-foreground text-sm font-medium hover:bg-primary/90
                           transition-colors disabled:opacity-50">
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Se salvează…' : 'Adaugă Material'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
