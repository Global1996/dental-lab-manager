// src/components/cases/caseSchema.ts
// Zod validation for case create/edit forms.
// Mirrors the `cases` table in 001_schema_and_seed.sql.

import { z } from 'zod'
import type { CaseStatus, WorkType } from '@/types'

// ─── Option lists ─────────────────────────────────────────────────────────────

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: 'crown',           label: 'Coroană' },
  { value: 'bridge',          label: 'Punte' },
  { value: 'veneer',          label: 'Fațetă' },
  { value: 'implant',         label: 'Implant' },
  { value: 'denture_full',    label: 'Proteză Totală' },
  { value: 'denture_partial', label: 'Proteză Parțială' },
  { value: 'orthodontic',     label: 'Ortodontic' },
  { value: 'inlay_onlay',     label: 'Inlay / Onlay' },
  { value: 'night_guard',     label: 'Gutieră Nocturnă' },
  { value: 'other',           label: 'Altele' },
]

export const CASE_STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'draft',             label: 'Schiță' },
  { value: 'in_progress',       label: 'În Desfășurare' },
  { value: 'awaiting_approval', label: 'În Așteptarea Aprobării' },
  { value: 'completed',         label: 'Finalizat' },
  { value: 'delivered',         label: 'Livrat' },
  { value: 'cancelled',         label: 'Anulat' },
]

// Status badge colors for the UI
export const STATUS_STYLES: Record<CaseStatus, { dot: string; badge: string }> = {
  draft:             { dot: 'bg-slate-400',   badge: 'bg-slate-100   text-slate-700   border-slate-200'  },
  in_progress:       { dot: 'bg-blue-500',    badge: 'bg-blue-50     text-blue-700    border-blue-200'   },
  awaiting_approval: { dot: 'bg-amber-500',   badge: 'bg-amber-50    text-amber-700   border-amber-200'  },
  completed:         { dot: 'bg-emerald-500', badge: 'bg-emerald-50  text-emerald-700 border-emerald-200'},
  delivered:         { dot: 'bg-green-600',   badge: 'bg-green-50    text-green-700   border-green-200'  },
  cancelled:         { dot: 'bg-red-400',     badge: 'bg-red-50      text-red-700     border-red-200'    },
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

export const caseSchema = z.object({
  patient_name: z
    .string()
    .min(1, 'Numele pacientului este obligatoriu')
    .max(150, 'Maxim 150 de caractere'),

  clinic_name: z
    .string()
    .max(150, 'Maxim 150 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  doctor_name: z
    .string()
    .max(150, 'Maxim 150 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  work_type: z.enum(
    ['crown','bridge','veneer','implant','denture_full','denture_partial',
     'orthodontic','inlay_onlay','night_guard','other'],
    { required_error: 'Tipul de lucrare este obligatoriu' }
  ),

  status: z.enum(
    ['draft','in_progress','awaiting_approval','completed','delivered','cancelled'],
    { required_error: 'Statusul este obligatoriu' }
  ),

  tooth_numbers: z
    .string()
    .max(100, 'Maxim 100 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  shade: z
    .string()
    .max(30, 'Maxim 30 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  received_date: z
    .string()
    .min(1, 'Data primirii este obligatorie'),

  due_date: z
    .string()
    .nullable()
    .optional()
    .transform(v => v || null),

  completed_date: z
    .string()
    .nullable()
    .optional()
    .transform(v => v || null),

  labor_cost: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Nu poate fi negativ')
    .max(999999, 'Valoarea este prea mare'),

  machine_cost: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Nu poate fi negativ')
    .max(999999, 'Valoarea este prea mare'),

  final_price: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Nu poate fi negativ')
    .max(999999, 'Valoarea este prea mare'),

  notes: z
    .string()
    .max(1000, 'Maxim 1000 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),
})

export type CaseFormValues = z.infer<typeof caseSchema>

// caseDefaults is a function (not a const object) because received_date must be
// computed fresh each time the dialog opens, not frozen at module load time.
export function caseDefaults(): CaseFormValues {
  return {
    patient_name:   '',
    clinic_name:    null,
    doctor_name:    null,
    work_type:      'crown',
    status:         'draft',
    tooth_numbers:  null,
    shade:          null,
    received_date:  new Date().toISOString().split('T')[0],
    due_date:       null,
    completed_date: null,
    labor_cost:     0,
    machine_cost:   0,
    final_price:    0,
    notes:          null,
  }
}

// ─── Case material usage schema ───────────────────────────────────────────────

export const addMaterialUsageSchema = z.object({
  material_id:  z.string().uuid('Selectați un material'),
  quantity_used: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .positive('Trebuie să fie mai mare decât zero')
    .max(999999, 'Valoarea este prea mare'),
  notes: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),
})

export type AddMaterialUsageValues = z.infer<typeof addMaterialUsageSchema>
