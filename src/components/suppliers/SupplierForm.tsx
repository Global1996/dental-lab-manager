// src/components/suppliers/SupplierForm.tsx
// Shared form body used inside both AddSupplierDialog and EditSupplierDialog.

import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FieldWrapper, Input, Textarea } from '@/components/ui/FormField'
import type { SupplierFormValues } from './supplierSchema'

interface Props {
  register: UseFormRegister<SupplierFormValues>
  errors:   FieldErrors<SupplierFormValues>
}

export function SupplierForm({ register, errors }: Props) {
  return (
    <div className="space-y-4">

      {/* Name */}
      <FieldWrapper
        label="Denumire furnizor"
        htmlFor="sup_name"
        required
        error={errors.name?.message}
      >
        <Input
          {...register('name')}
          id="sup_name"
          placeholder="ex. DentPro SRL"
          error={!!errors.name}
          autoFocus
        />
      </FieldWrapper>

      {/* Contact name */}
      <FieldWrapper
        label="Persoană de contact"
        htmlFor="sup_contact"
        error={errors.contact_name?.message}
      >
        <Input
          {...register('contact_name')}
          id="sup_contact"
          placeholder="ex. Ion Popescu"
        />
      </FieldWrapper>

      {/* Email + Phone side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper
          label="Email"
          htmlFor="sup_email"
          error={errors.email?.message}
        >
          <Input
            {...register('email')}
            id="sup_email"
            type="email"
            placeholder="contact@furnizor.ro"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Telefon"
          htmlFor="sup_phone"
          error={errors.phone?.message}
        >
          <Input
            {...register('phone')}
            id="sup_phone"
            type="tel"
            placeholder="ex. 0721 123 456"
          />
        </FieldWrapper>
      </div>

      {/* Notes */}
      <FieldWrapper
        label="Observații"
        htmlFor="sup_notes"
        error={errors.notes?.message}
        hint="Condiții de plată, timp de livrare, note interne…"
      >
        <Textarea
          {...register('notes')}
          id="sup_notes"
          placeholder="Note despre furnizor…"
          rows={3}
        />
      </FieldWrapper>

    </div>
  )
}
