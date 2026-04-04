// src/components/stock/stockSchema.ts
// Zod validation schemas for the three movement types.
// Each type has its own schema because validation rules differ.
//
// Key constraint from the DB:
//   quantity column is ALWAYS positive (direction is implied by movement_type).
//   For adjustments we let the user enter a signed value in the form,
//   then split it into movement_type + positive quantity in the server action.

import { z } from 'zod'

// ─── Shared field definitions ─────────────────────────────────────────────────

const materialIdField = z
  .string({ required_error: 'Selectați un material' })
  .uuid('Material invalid')

const quantityField = z
  .number({ invalid_type_error: 'Introduceți un număr' })
  .positive('Cantitatea trebuie să fie mai mare decât zero')
  .max(999999, 'Cantitatea este prea mare')

const notesField = z
  .string()
  .max(500, 'Notițele trebuie să aibă maxim 500 de caractere')
  .nullable()
  .optional()
  .transform(v => v?.trim() || null)

const reasonField = z
  .string()
  .max(200, 'Motivul trebuie să aibă maxim 200 de caractere')
  .nullable()
  .optional()
  .transform(v => v?.trim() || null)

const caseIdField = z
  .string()
  .uuid('Caz invalid')
  .nullable()
  .optional()
  .transform(v => v || null)

// ─── Stock In ─────────────────────────────────────────────────────────────────
// Records receipt of new stock from a supplier.

export const stockInSchema = z.object({
  material_id:  materialIdField,
  quantity:     quantityField,
  unit_cost:    z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .min(0, 'Costul nu poate fi negativ')
    .max(999999, 'Costul este prea mare')
    .nullable()
    .optional(),
  batch_number: z
    .string()
    .max(80, 'Numărul de lot trebuie să aibă maxim 80 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),
  expiry_date:  z
    .string()
    .nullable()
    .optional()
    .refine(
      v => !v || !isNaN(Date.parse(v)),
      'Introduceți o dată validă'
    )
    .transform(v => v || null),
  reason:       reasonField,
  notes:        notesField,
})

export type StockInValues = z.infer<typeof stockInSchema>

// ─── Stock Out ────────────────────────────────────────────────────────────────
// Records consumption of stock (manual, not via case assignment).

export const stockOutSchema = z.object({
  material_id: materialIdField,
  quantity:    quantityField,
  case_id:     caseIdField,
  reason:      reasonField,
  notes:       notesField,
})

export type StockOutValues = z.infer<typeof stockOutSchema>

// ─── Adjustment ───────────────────────────────────────────────────────────────
// Corrects stock count after a stocktake or data-entry error.
// The user enters a SIGNED delta (e.g. +10 to add, -5 to remove).
// The server action converts this to the correct movement_type + positive quantity.

export const stockAdjustmentSchema = z.object({
  material_id:   materialIdField,
  delta:         z
    .number({ invalid_type_error: 'Introduceți un număr' })
    .refine(v => v !== 0, 'Valoarea nu poate fi zero — folosiți un număr pozitiv sau negativ')
    .refine(v => Math.abs(v) <= 999999, 'Valoarea este prea mare'),
  reason:        z
    .string()
    .min(1, 'Motivul este obligatoriu pentru ajustări')
    .max(200, 'Motivul trebuie să aibă maxim 200 de caractere'),
  notes:         notesField,
})

export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>

// ─── Default values ───────────────────────────────────────────────────────────

export const stockInDefaults: StockInValues = {
  material_id:  '',
  quantity:     1,
  unit_cost:    null,
  batch_number: null,
  expiry_date:  null,
  reason:       null,
  notes:        null,
}

export const stockOutDefaults: StockOutValues = {
  material_id: '',
  quantity:    1,
  case_id:     null,
  reason:      null,
  notes:       null,
}

export const stockAdjustmentDefaults: StockAdjustmentValues = {
  material_id: '',
  delta:       0,
  reason:      '',
  notes:       null,
}
