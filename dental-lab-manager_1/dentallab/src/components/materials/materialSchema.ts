// src/components/materials/materialSchema.ts
// Zod validation for the material create/edit form.
// All field names match the `materials` DB table exactly.

import { z } from 'zod'

export const UNIT_OPTIONS = [
  { value: 'ml',      label: 'ml — mililitru' },
  { value: 'g',       label: 'g — gram' },
  { value: 'kg',      label: 'kg — kilogram' },
  { value: 'mg',      label: 'mg — miligram' },
  { value: 'piece',   label: 'Bucată' },
  { value: 'pack',    label: 'Pachet' },
  { value: 'box',     label: 'Cutie' },
  { value: 'tube',    label: 'Tub' },
  { value: 'syringe', label: 'Seringă' },
] as const

// Reusable trimmed-string-or-null helper used throughout
const optionalText = (max: number, maxMsg: string) =>
  z.string()
    .max(max, maxMsg)
    .nullable()
    .optional()
    .transform(v => v?.trim() || null)

// Reusable non-negative number
const money = z
  .number({ invalid_type_error: 'Introduceți un număr' })
  .min(0, 'Nu poate fi negativ')
  .max(999_999, 'Valoarea este prea mare')

export const materialSchema = z.object({
  name: z
    .string()
    .min(1, 'Denumirea este obligatorie')
    .max(150, 'Maxim 150 de caractere'),

  sku: optionalText(80, 'SKU-ul trebuie să aibă maxim 80 de caractere'),

  category_id: z
    .string()
    .uuid('Categorie invalidă')
    .nullable()
    .optional()
    .transform(v => v || null),

  supplier_id: z
    .string()
    .uuid('Furnizor invalid')
    .nullable()
    .optional()
    .transform(v => v || null),

  unit: z.enum(
    ['ml', 'g', 'kg', 'mg', 'piece', 'pack', 'box', 'tube', 'syringe'],
    { required_error: 'Unitatea de măsură este obligatorie' }
  ),

  // cost_per_unit — the real DB column name (not unit_cost)
  cost_per_unit: money,

  // min_threshold — the real DB column name (not reorder_level)
  min_threshold: z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Nu poate fi negativ')
    .max(999_999, 'Valoarea este prea mare'),

  // expiry_date — a direct date field (not a boolean has_expiry flag)
  expiry_date: z
    .string()
    .nullable()
    .optional()
    .refine(v => !v || !isNaN(Date.parse(v)), 'Introduceți o dată validă')
    .transform(v => v || null),

  location: optionalText(100, 'Locația trebuie să aibă maxim 100 de caractere'),

  notes: optionalText(500, 'Observațiile trebuie să aibă maxim 500 de caractere'),

  is_active: z.boolean().default(true),
})

export type MaterialFormValues = z.infer<typeof materialSchema>

export const materialDefaults: MaterialFormValues = {
  name:          '',
  sku:           null,
  category_id:   null,
  supplier_id:   null,
  unit:          'piece',
  cost_per_unit: 0,
  min_threshold: 0,
  expiry_date:   null,
  location:      null,
  notes:         null,
  is_active:     true,
}
