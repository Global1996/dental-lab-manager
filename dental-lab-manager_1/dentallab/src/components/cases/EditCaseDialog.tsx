'use client'
// src/components/cases/EditCaseDialog.tsx
// Pre-fills all case fields from the existing row.
// material_cost is read-only (DB-managed) — shown for reference only.

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Pencil, X, Loader2 } from 'lucide-react'
import { Dialog, DialogFooter } from '@/components/ui/Dialog'
import { caseSchema, type CaseFormValues } from './caseSchema'
import { updateCase } from './caseActions'
import { CaseForm } from './CaseForm'
import type { Case } from '@/types'

interface Props { case_: Case }

function toFormValues(c: Case): CaseFormValues {
  return {
    patient_name:   c.patient_name,
    clinic_name:    c.clinic_name,
    doctor_name:    c.doctor_name,
    work_type:      c.work_type as CaseFormValues['work_type'],
    status:         c.status    as CaseFormValues['status'],
    tooth_numbers:  c.tooth_numbers,
    shade:          c.shade,
    received_date:  c.received_date,
    due_date:       c.due_date,
    completed_date: c.completed_date,
    labor_cost:     Number(c.labor_cost),
    machine_cost:   Number(c.machine_cost),
    final_price:    Number(c.final_price),
    notes:          c.notes,
  }
}

export function EditCaseDialog({ case_: c }: Props) {
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<CaseFormValues>({
      resolver: zodResolver(caseSchema),
      defaultValues: toFormValues(c),
    })

  function handleOpen() {
    reset(toFormValues(c))
    setOpen(true)
  }

  async function onSubmit(values: CaseFormValues) {
    const result = await updateCase(c.id, values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Caz actualizat', { description: c.case_code })
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    setOpen(false)
  }

  return (
    <>
      <button onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm
                   font-medium hover:bg-accent transition-colors">
        <Pencil className="w-3.5 h-3.5" />
        Editează Cazul
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="edit-case-title">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto
                          rounded-2xl border bg-background shadow-2xl flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
              <div>
                <h2 id="edit-case-title" className="text-base font-semibold">Editează Cazul</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.case_code}</p>
              </div>
              <button onClick={handleClose} disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1">
              <div className="px-6 py-5 flex-1">
                <CaseForm register={register} errors={errors} isEdit />
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30 sticky bottom-0">
                <button type="button" onClick={handleClose} disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  Anulează
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary
                             text-primary-foreground text-sm font-medium hover:bg-primary/90
                             transition-colors disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Se salvează…' : 'Salvează Modificările'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
