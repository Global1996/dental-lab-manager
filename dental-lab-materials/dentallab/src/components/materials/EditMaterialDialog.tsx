'use client'
// src/components/materials/EditMaterialDialog.tsx
// Dialog for editing an existing material.
// Pre-fills all fields from the existing material row.
// On save, calls the updateMaterial Server Action.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Pencil, Loader2, X } from 'lucide-react'
import { materialSchema, type MaterialFormValues } from './materialSchema'
import { updateMaterial } from './materialActions'
import { MaterialForm } from './MaterialForm'
import type { Category, Supplier, Material } from '@/types'

interface Props {
  material:   Material
  categories: Category[]
  suppliers:  Supplier[]
}

// Convert the DB row into form-compatible default values.
// Numbers come back as strings from Postgres via JSON — coerce them.
function toFormValues(m: Material): MaterialFormValues {
  return {
    name:                m.name,
    sku:                 m.sku,
    description:         m.description,
    category_id:         m.category_id,
    supplier_id:         m.supplier_id,
    unit:                m.unit,
    unit_cost:           Number(m.unit_cost),
    reorder_level:       Number(m.reorder_level),
    reorder_quantity:    Number(m.reorder_quantity),
    has_expiry:          m.has_expiry,
    expiry_warning_days: Number(m.expiry_warning_days),
    is_active:           m.is_active,
  }
}

export function EditMaterialDialog({ material, categories, suppliers }: Props) {
  const [open, setOpen] = useState(false)

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: toFormValues(material),
  })

  const { handleSubmit, reset, formState: { isSubmitting, errors } } = form

  function handleOpen() {
    // Re-seed form with current material values every time the dialog opens
    reset(toFormValues(material))
    setOpen(true)
  }

  function handleClose() {
    if (isSubmitting) return
    setOpen(false)
  }

  async function onSubmit(values: MaterialFormValues) {
    const result = await updateMaterial(material.id, values)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Material updated')
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button — small icon button in the table row */}
      <button
        onClick={handleOpen}
        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                   hover:text-foreground transition-colors"
        aria-label={`Edit ${material.name}`}
        title="Edit material"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dialog-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto
                          rounded-2xl border bg-background shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b
                            sticky top-0 bg-background z-10">
              <div>
                <h2 id="edit-dialog-title" className="text-base font-semibold">
                  Edit Material
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                  {material.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                           hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="px-6 py-5">
                <MaterialForm
                  control={form.control}
                  register={form.register}
                  errors={errors}
                  categories={categories}
                  suppliers={suppliers}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t
                              bg-muted/30 sticky bottom-0">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium
                             hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-primary text-primary-foreground text-sm font-medium
                             hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
