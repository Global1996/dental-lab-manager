// src/components/purchase-orders/poSchema.ts
// Zod schemas for purchase order forms.

import { z } from 'zod'

// ─── Single line item ─────────────────────────────────────────────────────────

export const poItemSchema = z.object({
  material_id:      z.string().uuid('Selectați un material').nullable().optional(),
  material_name:    z.string().min(1, 'Denumirea materialului este obligatorie').max(200),
  unit:             z.string().min(1, 'Unitatea este obligatorie').max(30),
  quantity_ordered: z
    .number({ invalid_type_error: 'Introduceți o cantitate' })
    .positive('Cantitatea trebuie să fie mai mare decât zero')
    .max(999_999, 'Cantitate prea mare'),
  unit_cost: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Nu poate fi negativ')
    .max(999_999, 'Valoare prea mare')
    .nullable()
    .optional(),
  notes: z.string().max(500).nullable().optional().transform(v => v?.trim() || null),
})

export type PoItemValues = z.infer<typeof poItemSchema>

// ─── Full order header ────────────────────────────────────────────────────────

export const poSchema = z.object({
  supplier_id: z
    .string()
    .uuid('Selectați un furnizor')
    .nullable()
    .optional()
    .transform(v => v || null),
  order_date: z.string().min(1, 'Data comenzii este obligatorie'),
  expected_date: z
    .string()
    .nullable()
    .optional()
    .transform(v => v || null),
  notes: z.string().max(1000).nullable().optional().transform(v => v?.trim() || null),
  items: z.array(poItemSchema).min(1, 'Adăugați cel puțin un material'),
})

export type PoFormValues = z.infer<typeof poSchema>

// ─── Empty item template ──────────────────────────────────────────────────────

export function emptyItem(): PoItemValues {
  return {
    material_id:      null,
    material_name:    '',
    unit:             'piece',
    quantity_ordered: 1,
    unit_cost:        null,
    notes:            null,
  }
}

// ─── Status config ────────────────────────────────────────────────────────────

export type PoStatus = 'draft' | 'ordered' | 'received' | 'cancelled'

export const PO_STATUS_OPTIONS: { value: PoStatus; label: string }[] = [
  { value: 'draft',     label: 'Schiță' },
  { value: 'ordered',   label: 'Comandată' },
  { value: 'received',  label: 'Recepționată' },
  { value: 'cancelled', label: 'Anulată' },
]

export const PO_STATUS_STYLES: Record<PoStatus, { badge: string; dot: string }> = {
  draft:     { dot: 'bg-slate-400',   badge: 'bg-slate-100   text-slate-700  border-slate-200'  },
  ordered:   { dot: 'bg-blue-500',    badge: 'bg-blue-50     text-blue-700   border-blue-200'   },
  received:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50  text-emerald-700 border-emerald-200'},
  cancelled: { dot: 'bg-red-400',     badge: 'bg-red-50      text-red-700    border-red-200'    },
}
