'use client'
// src/components/suppliers/EditSupplierDialog.tsx
// Dialog to edit an existing supplier.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Pencil, Loader2, X } from 'lucide-react'
import { supplierSchema, type SupplierFormValues } from './supplierSchema'
import { updateSupplier } from './supplierActions'
import { SupplierForm } from './SupplierForm'
import type { Supplier } from '@/types'

interface Props { supplier: Supplier }

// Map a DB Supplier row to the form values shape
function toFormValues(s: Supplier): SupplierFormValues {
  return {
    name:         s.name,
    contact_name: s.contact_name,
    email:        s.email,
    phone:        s.phone,
    notes:        s.notes,
  }
}

export function EditSupplierDialog({ supplier }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register, handleSubmit, reset,
    formState: { isSubmitting, errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: toFormValues(supplier),
  })

  function handleOpen() {
    reset(toFormValues(supplier))
    setOpen(true)
  }

  function handleClose() {
    if (isSubmitting) return
    setOpen(false)
  }

  async function onSubmit(values: SupplierFormValues) {
    const result = await updateSupplier(supplier.id, values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Furnizor actualizat', { description: values.name })
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                   hover:text-foreground transition-colors"
        aria-label={`Editează ${supplier.name}`}
        title="Editează furnizorul"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sup-title"
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
                <h2 id="edit-sup-title" className="text-base font-semibold">
                  Editează furnizor
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                  {supplier.name}
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
                {isSubmitting ? 'Se salvează…' : 'Salvează Modificările'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
