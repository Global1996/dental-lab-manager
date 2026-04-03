// src/components/materials/MaterialForm.tsx
// Shared form body used in both AddMaterialDialog and EditMaterialDialog.

import { type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { FieldWrapper, Input, Textarea, Select } from '@/components/ui/FormField'
import { UNIT_OPTIONS, type MaterialFormValues } from './materialSchema'
import type { Category, Supplier } from '@/types'

interface Props {
  register:   UseFormRegister<MaterialFormValues>
  errors:     FieldErrors<MaterialFormValues>
  categories: Category[]
  suppliers:  Supplier[]
}

export function MaterialForm({ register, errors, categories, suppliers }: Props) {
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  return (
    <div className="space-y-5">

      {/* Name + SKU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Denumire" htmlFor="mat_name" required error={errors.name?.message}>
          <Input
            {...register('name')}
            id="mat_name"
            placeholder="ex. IPS e.max CAD Block A2"
            error={!!errors.name}
            autoFocus
          />
        </FieldWrapper>

        <FieldWrapper label="SKU" htmlFor="mat_sku" error={errors.sku?.message}
          hint="Cod unic de produs de la furnizor">
          <Input
            {...register('sku')}
            id="mat_sku"
            placeholder="ex. IPS-EMAXCAD-A2LT"
            error={!!errors.sku}
          />
        </FieldWrapper>
      </div>

      {/* Category + Supplier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Categorie" htmlFor="mat_category" error={errors.category_id?.message}>
          <Select
            {...register('category_id')}
            id="mat_category"
            placeholder="— Selectează categoria —"
            options={categoryOptions}
            error={!!errors.category_id}
          />
        </FieldWrapper>

        <FieldWrapper label="Furnizor" htmlFor="mat_supplier" error={errors.supplier_id?.message}>
          <Select
            {...register('supplier_id')}
            id="mat_supplier"
            placeholder="— Selectează furnizorul —"
            options={supplierOptions}
            error={!!errors.supplier_id}
          />
        </FieldWrapper>
      </div>

      {/* Unit + Cost per unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Unitate de măsură" htmlFor="mat_unit" required error={errors.unit?.message}>
          <Select
            {...register('unit')}
            id="mat_unit"
            options={UNIT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            error={!!errors.unit}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Cost pe unitate (RON)"
          htmlFor="mat_cost"
          required
          error={errors.cost_per_unit?.message}
          hint="Prețul de achiziție — folosit la calculul costurilor"
        >
          <Input
            {...register('cost_per_unit', { valueAsNumber: true })}
            id="mat_cost"
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.00"
            error={!!errors.cost_per_unit}
          />
        </FieldWrapper>
      </div>

      {/* Min threshold + Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper
          label="Prag minim"
          htmlFor="mat_threshold"
          error={errors.min_threshold?.message}
          hint="Alerta de stoc redus se declanșează când cantitatea atinge acest nivel"
        >
          <Input
            {...register('min_threshold', { valueAsNumber: true })}
            id="mat_threshold"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            error={!!errors.min_threshold}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Locație depozitare"
          htmlFor="mat_location"
          error={errors.location?.message}
          hint="ex. Raft B2, Frigider F1"
        >
          <Input
            {...register('location')}
            id="mat_location"
            placeholder="ex. Raft B2"
          />
        </FieldWrapper>
      </div>

      {/* Expiry date */}
      <FieldWrapper
        label="Data expirării"
        htmlFor="mat_expiry"
        error={errors.expiry_date?.message}
        hint="Lasă gol dacă materialul nu expiră"
      >
        <Input
          {...register('expiry_date')}
          id="mat_expiry"
          type="date"
          className="max-w-[200px]"
        />
      </FieldWrapper>

      {/* Notes */}
      <FieldWrapper label="Observații" htmlFor="mat_notes" error={errors.notes?.message}>
        <Textarea
          {...register('notes')}
          id="mat_notes"
          placeholder="Nuanță, compoziție, instrucțiuni speciale de manipulare…"
          rows={3}
        />
      </FieldWrapper>

    </div>
  )
}
