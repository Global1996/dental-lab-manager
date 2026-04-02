// src/components/materials/materialSchema.ts
// Single source of truth for material form validation.
// Used by both the Add and Edit dialogs.

import { z } from 'zod'

export const UNIT_OPTIONS = [
  { value: 'ml',      label: 'ml (millilitre)' },
  { value: 'g',       label: 'g (gram)' },
  { value: 'kg',      label: 'kg (kilogram)' },
  { value: 'mg',      label: 'mg (milligram)' },
  { value: 'piece',   label: 'Piece' },
  { value: 'pack',    label: 'Pack' },
  { value: 'box',     label: 'Box' },
  { value: 'tube',    label: 'Tube' },
  { value: 'syringe', label: 'Syringe' },
] as const

export const materialSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(120, 'Name must be 120 characters or fewer'),

  sku: z
    .string()
    .max(60, 'SKU must be 60 characters or fewer')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  category_id: z
    .string()
    .uuid('Invalid category')
    .nullable()
    .optional()
    .transform(v => v || null),

  supplier_id: z
    .string()
    .uuid('Invalid supplier')
    .nullable()
    .optional()
    .transform(v => v || null),

  unit: z.enum(
    ['ml', 'g', 'kg', 'mg', 'piece', 'pack', 'box', 'tube', 'syringe'],
    { required_error: 'Unit is required' }
  ),

  unit_cost: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cost cannot be negative')
    .max(999999, 'Cost is too large'),

  reorder_level: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cannot be negative')
    .max(999999, 'Value is too large'),

  reorder_quantity: z
    .number({ invalid_type_error: 'Enter a number' })
    .min(0, 'Cannot be negative')
    .max(999999, 'Value is too large'),

  has_expiry: z.boolean().default(false),

  expiry_warning_days: z
    .number({ invalid_type_error: 'Enter a number' })
    .int('Must be a whole number')
    .min(1, 'Must be at least 1 day')
    .max(365, 'Must be 365 days or fewer')
    .default(30),

  is_active: z.boolean().default(true),
})

export type MaterialFormValues = z.infer<typeof materialSchema>

// Default values for the Add dialog
export const materialDefaults: MaterialFormValues = {
  name: '',
  sku: null,
  description: null,
  category_id: null,
  supplier_id: null,
  unit: 'piece',
  unit_cost: 0,
  reorder_level: 0,
  reorder_quantity: 0,
  has_expiry: false,
  expiry_warning_days: 30,
  is_active: true,
}
