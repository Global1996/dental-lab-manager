'use client'
// src/components/materials/AddMaterialDialog.tsx
// Dialog for creating a new material.
// Uses react-hook-form + Zod for validation, then calls the createMaterial
// Server Action. On success, Next.js revalidates the page automatically.

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

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: materialDefaults,
  })

  const { handleSubmit, reset, formState: { isSubmitting, errors } } = form

  async function onSubmit(values: MaterialFormValues) {
    const result = await createMaterial(values)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success('Material added successfully')
    reset(materialDefaults)
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(materialDefaults)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                   text-sm font-medium text-primary-foreground shadow-sm
                   hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Material
      </button>
    )
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dialog-title"
    >
      {/* Click-outside overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto
                      rounded-2xl border bg-background shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 id="add-dialog-title" className="text-base font-semibold">Add Material</h2>
            <p className="text-xs text-muted-foreground mt-0.5">New item in the materials catalogue</p>
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

        {/* Form body */}
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

          {/* Footer actions */}
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
              {isSubmitting ? 'Saving…' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
