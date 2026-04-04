'use client'
// src/components/cases/CreateCaseDialog.tsx
// Opens a full-height dialog to create a new case.
// On success, redirects to the new case detail page.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Briefcase, X, Loader2 } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { caseSchema, caseDefaults, type CaseFormValues } from './caseSchema'
import { createCase } from './caseActions'
import { CaseForm } from './CaseForm'

export function CreateCaseDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CaseFormValues>({
      resolver: zodResolver(caseSchema),
      defaultValues: caseDefaults(),
    })

  async function onSubmit(values: CaseFormValues) {
    const result = await createCase(values)
    if (!result.success) { toast.error(result.error); return }

    toast.success('Caz creat', { description: `Codul cazului a fost atribuit automat.` })
    reset(caseDefaults())
    setOpen(false)
    if (result.id) router.push(`/cases/${result.id}`)
  }

  function handleClose() {
    if (isSubmitting) return
    reset(caseDefaults())
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
        Caz Nou
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="create-case-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto
                          rounded-2xl border bg-background shadow-2xl flex flex-col">

            {/* Header — sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b
                            sticky top-0 bg-background z-10">
              <div className="flex items-center gap-3">
                <span className="inline-flex p-2 rounded-lg bg-primary/10">
                  <Briefcase className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <h2 id="create-case-title" className="text-base font-semibold">Caz Nou</h2>
                  <p className="text-xs text-muted-foreground">Codul cazului se atribuie automat</p>
                </div>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                           hover:text-foreground transition-colors disabled:opacity-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1">
              <div className="px-6 py-5 flex-1">
                <CaseForm register={register} errors={errors} />
              </div>

              {/* Footer — sticky */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t
                              bg-muted/30 sticky bottom-0">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium
                             hover:bg-accent transition-colors disabled:opacity-50">
                  Anulează
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-primary text-primary-foreground text-sm font-medium
                             hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Se creează…' : 'Creează Caz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
