// src/components/suppliers/supplierSchema.ts
// Zod schema for supplier create/edit forms.
// All field names match the `suppliers` DB table exactly.

import { z } from 'zod'

export const supplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Denumirea furnizorului este obligatorie')
    .max(150, 'Maxim 150 de caractere'),

  contact_name: z
    .string()
    .max(100, 'Maxim 100 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  email: z
    .string()
    .email('Introduceți o adresă de email validă')
    .max(150, 'Maxim 150 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  phone: z
    .string()
    .max(30, 'Maxim 30 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),

  notes: z
    .string()
    .max(1000, 'Maxim 1000 de caractere')
    .nullable()
    .optional()
    .transform(v => v?.trim() || null),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>

export const supplierDefaults: SupplierFormValues = {
  name:         '',
  contact_name: null,
  email:        null,
  phone:        null,
  notes:        null,
}
