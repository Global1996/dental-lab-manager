// src/components/cases/CaseForm.tsx
// Shared form fields rendered inside both CreateCaseDialog and EditCaseDialog.
// Receives react-hook-form register/errors from the parent so each dialog owns
// its own form state and submit handler.

import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FieldWrapper, Input, Select, Textarea } from '@/components/ui/FormField'
import { WORK_TYPE_OPTIONS, CASE_STATUS_OPTIONS, type CaseFormValues } from './caseSchema'

interface Props {
  register: UseFormRegister<CaseFormValues>
  errors:   FieldErrors<CaseFormValues>
  isEdit?:  boolean
}

export function CaseForm({ register, errors, isEdit = false }: Props) {
  return (
    <div className="space-y-5">

      {/* ── Patient details ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Detalii Pacient
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Nume pacient" htmlFor="cf_patient" required
            error={errors.patient_name?.message}>
            <Input {...register('patient_name')} id="cf_patient"
              placeholder="ex. Maria Ionescu"
              error={!!errors.patient_name} autoFocus={!isEdit} />
          </FieldWrapper>

          <FieldWrapper label="Clinică" htmlFor="cf_clinic"
            error={errors.clinic_name?.message}>
            <Input {...register('clinic_name')} id="cf_clinic"
              placeholder="ex. Clinica Surâsul" />
          </FieldWrapper>

          <FieldWrapper label="Doctor" htmlFor="cf_doctor"
            error={errors.doctor_name?.message} className="sm:col-span-2">
            <Input {...register('doctor_name')} id="cf_doctor"
              placeholder="ex. Dr. Andrei Popescu" />
          </FieldWrapper>
        </div>
      </div>

      {/* ── Work details ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Detalii Lucrare
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrapper label="Tip lucrare" htmlFor="cf_work_type" required
            error={errors.work_type?.message}>
            <Select {...register('work_type')} id="cf_work_type"
              options={WORK_TYPE_OPTIONS}
              error={!!errors.work_type} />
          </FieldWrapper>

          <FieldWrapper label="Status" htmlFor="cf_status" required
            error={errors.status?.message}>
            <Select {...register('status')} id="cf_status"
              options={CASE_STATUS_OPTIONS}
              error={!!errors.status} />
          </FieldWrapper>

          <FieldWrapper label="Numerele dinților" htmlFor="cf_tooth"
            hint='Separate prin virgulă, ex. "11, 12, 21"'
            error={errors.tooth_numbers?.message}>
            <Input {...register('tooth_numbers')} id="cf_tooth"
              placeholder="11, 12, 21" />
          </FieldWrapper>

          <FieldWrapper label="Nuanță" htmlFor="cf_shade"
            hint='ex. A2, B1 HT'
            error={errors.shade?.message}>
            <Input {...register('shade')} id="cf_shade"
              placeholder="A2" />
          </FieldWrapper>
        </div>
      </div>

      {/* ── Date ───────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Date
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldWrapper label="Data primirii" htmlFor="cf_recv" required
            error={errors.received_date?.message}>
            <Input {...register('received_date')} id="cf_recv" type="date"
              error={!!errors.received_date} />
          </FieldWrapper>

          <FieldWrapper label="Termen limită" htmlFor="cf_due"
            error={errors.due_date?.message}>
            <Input {...register('due_date')} id="cf_due" type="date" />
          </FieldWrapper>

          <FieldWrapper label="Data finalizării" htmlFor="cf_completed"
            error={errors.completed_date?.message}>
            <Input {...register('completed_date')} id="cf_completed" type="date" />
          </FieldWrapper>
        </div>
      </div>

      {/* ── Costs & pricing ─────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Costuri și Prețuri
        </p>
        <div className="rounded-lg border bg-muted/30 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldWrapper label="Cost manoperă (RON)" htmlFor="cf_labor"
            hint="Timp manual al tehnicianului" error={errors.labor_cost?.message}>
            <Input {...register('labor_cost', { valueAsNumber: true })}
              id="cf_labor" type="number" step="0.01" min="0"
              placeholder="0.00" error={!!errors.labor_cost} />
          </FieldWrapper>

          <FieldWrapper label="Cost utilaje (RON)" htmlFor="cf_machine"
            hint="Timp frezare / utilaje" error={errors.machine_cost?.message}>
            <Input {...register('machine_cost', { valueAsNumber: true })}
              id="cf_machine" type="number" step="0.01" min="0"
              placeholder="0.00" error={!!errors.machine_cost} />
          </FieldWrapper>

          <FieldWrapper label="Preț final (RON)" htmlFor="cf_price"
            hint="Facturat clinicii" error={errors.final_price?.message}>
            <Input {...register('final_price', { valueAsNumber: true })}
              id="cf_price" type="number" step="0.01" min="0"
              placeholder="0.00" error={!!errors.final_price} />
          </FieldWrapper>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Costul materialelor se calculează automat când materialele sunt adăugate la caz.
        </p>
      </div>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      <FieldWrapper label="Observații" htmlFor="cf_notes" error={errors.notes?.message}>
        <Textarea {...register('notes')} id="cf_notes"
          placeholder="Instrucțiuni speciale, preferințe pacient, notițe doctor…"
          rows={3} />
      </FieldWrapper>

    </div>
  )
}
