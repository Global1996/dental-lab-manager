'use client'
// src/components/suppliers/AddSupplierDialog.tsx
// Dialog to create a new supplier.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
import { supplierSchema, supplierDefaults, type SupplierFormValues } from './supplierSchema'
import { createSupplier } from './supplierActions'
import { SupplierForm } from './SupplierForm'

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false)

  const {
    register, handleSubmit, reset,
    formState: { isSubmitting, errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplierDefaults,
  })

  async function onSubmit(values: SupplierFormValues) {
    const result = await createSupplier(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Furnizor adăugat', { description: values.name })
    reset(supplierDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(supplierDefaults)
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
        Adaugă Furnizor
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-sup-title"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col
                       rounded-2xl border bg-background shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 id="add-sup-title" className="text-base font-semibold">
                  Furnizor nou
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adăugați un furnizor în catalog
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                           hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <SupplierForm register={register} errors={errors} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4
                            border-t bg-muted/30 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border text-sm font-medium
                           hover:bg-accent transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-primary text-primary-foreground text-sm font-medium
                           hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Se salvează…' : 'Adaugă Furnizor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
