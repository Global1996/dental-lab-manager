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
  .string({ required_error: 'Select a material' })
  .uuid('Invalid material')

const quantityField = z
  .number({ invalid_type_error: 'Enter a number' })
  .positive('Quantity must be greater than zero')
  .max(999999, 'Quantity is too large')

const notesField = z
  .string()
  .max(500, 'Notes must be 500 characters or fewer')
  .nullable()
  .optional()
  .transform(v => v?.trim() || null)

const reasonField = z
  .string()
  .max(200, 'Reason must be 200 characters or fewer')
  .nullable()
  .optional()
  .transform(v => v?.trim() || null)

const caseIdField = z
  .string()
  .uuid('Invalid case')
  .nullable()
  .optional()
  .transform(v => v || null)

// ─── Stock In ─────────────────────────────────────────────────────────────────
// Records receipt of new stock from a supplier.

export const stockInSchema = z.object({
  material_id:  materialIdField,
  quantity:     quantityField,
  unit_cost:    z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cost cannot be negative')
    .max(999999, 'Cost is too large')
    .nullable()
    .optional(),
  batch_number: z
    .string()
    .max(80, 'Batch number must be 80 characters or fewer')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),
  expiry_date:  z
    .string()
    .nullable()
    .optional()
    .refine(
      v => !v || !isNaN(Date.parse(v)),
      'Enter a valid date'
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
    .number({ invalid_type_error: 'Enter a number' })
    .refine(v => v !== 0, 'Delta cannot be zero — use a positive or negative number')
    .refine(v => Math.abs(v) <= 999999, 'Value is too large'),
  reason:        z
    .string()
    .min(1, 'Reason is required for adjustments')
    .max(200, 'Reason must be 200 characters or fewer'),
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
