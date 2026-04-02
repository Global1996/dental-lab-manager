// src/components/materials/MaterialForm.tsx
// The actual form fields for a material.
// Rendered inside both <AddMaterialDialog> and <EditMaterialDialog>.
// Accepts the react-hook-form `control` and `register` so the parent
// dialog owns the form state and the submit handler.

import { useController, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { FieldWrapper, Input, Textarea, Select, CheckboxField } from '@/components/ui/FormField'
import { UNIT_OPTIONS, type MaterialFormValues } from './materialSchema'
import type { Category, Supplier } from '@/types'

interface Props {
  control:    Control<MaterialFormValues>
  register:   UseFormRegister<MaterialFormValues>
  errors:     FieldErrors<MaterialFormValues>
  categories: Category[]
  suppliers:  Supplier[]
}

export function MaterialForm({ control, register, errors, categories, suppliers }: Props) {
  // useController for checkbox fields (react-hook-form needs controlled input for booleans)
  const { field: hasExpiry }  = useController({ name: 'has_expiry',  control })
  const { field: isActive }   = useController({ name: 'is_active',   control })

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  return (
    <div className="space-y-5">

      {/* ── Row 1: Name + SKU ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Name" htmlFor="name" required error={errors.name?.message}>
          <Input
            {...register('name')}
            id="name"
            placeholder="e.g. IPS e.max CAD Block A2"
            error={!!errors.name}
            autoFocus
          />
        </FieldWrapper>

        <FieldWrapper
          label="SKU"
          htmlFor="sku"
          error={errors.sku?.message}
          hint="Leave blank to auto-generate"
        >
          <Input
            {...register('sku')}
            id="sku"
            placeholder="e.g. IPS-EMAXCAD-A2LT"
            error={!!errors.sku}
          />
        </FieldWrapper>
      </div>

      {/* ── Row 2: Category + Supplier ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Category" htmlFor="category_id" error={errors.category_id?.message}>
          <Select
            {...register('category_id')}
            id="category_id"
            placeholder="— Select category —"
            options={categoryOptions}
            error={!!errors.category_id}
          />
        </FieldWrapper>

        <FieldWrapper label="Supplier" htmlFor="supplier_id" error={errors.supplier_id?.message}>
          <Select
            {...register('supplier_id')}
            id="supplier_id"
            placeholder="— Select supplier —"
            options={supplierOptions}
            error={!!errors.supplier_id}
          />
        </FieldWrapper>
      </div>

      {/* ── Row 3: Unit + Cost per unit ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper label="Unit of measure" htmlFor="unit" required error={errors.unit?.message}>
          <Select
            {...register('unit')}
            id="unit"
            options={UNIT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            error={!!errors.unit}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Cost per unit ($)"
          htmlFor="unit_cost"
          required
          error={errors.unit_cost?.message}
          hint="Purchase price used to calculate case costs"
        >
          <Input
            {...register('unit_cost', { valueAsNumber: true })}
            id="unit_cost"
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.00"
            error={!!errors.unit_cost}
          />
        </FieldWrapper>
      </div>

      {/* ── Row 4: Min threshold + Reorder quantity ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldWrapper
          label="Min threshold (low-stock alert)"
          htmlFor="reorder_level"
          error={errors.reorder_level?.message}
          hint="Alert fires when stock falls to this level"
        >
          <Input
            {...register('reorder_level', { valueAsNumber: true })}
            id="reorder_level"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            error={!!errors.reorder_level}
          />
        </FieldWrapper>

        <FieldWrapper
          label="Reorder quantity"
          htmlFor="reorder_quantity"
          error={errors.reorder_quantity?.message}
          hint="Suggested quantity when placing a new order"
        >
          <Input
            {...register('reorder_quantity', { valueAsNumber: true })}
            id="reorder_quantity"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            error={!!errors.reorder_quantity}
          />
        </FieldWrapper>
      </div>

      {/* ── Expiry settings ─────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <CheckboxField
          id="has_expiry"
          label="This material has an expiry date"
          hint="Enables expiry tracking and alerts for this material"
          checked={hasExpiry.value}
          onChange={hasExpiry.onChange}
        />

        {hasExpiry.value && (
          <FieldWrapper
            label="Warn before expiry (days)"
            htmlFor="expiry_warning_days"
            error={errors.expiry_warning_days?.message}
            hint="Show an alert this many days before a batch expires"
          >
            <Input
              {...register('expiry_warning_days', { valueAsNumber: true })}
              id="expiry_warning_days"
              type="number"
              step="1"
              min="1"
              max="365"
              placeholder="30"
              className="max-w-[160px]"
              error={!!errors.expiry_warning_days}
            />
          </FieldWrapper>
        )}
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <FieldWrapper label="Description / Notes" htmlFor="description" error={errors.description?.message}>
        <Textarea
          {...register('description')}
          id="description"
          placeholder="Shade, composition, intended use…"
          rows={3}
          error={!!errors.description}
        />
      </FieldWrapper>

      {/* ── Active toggle ───────────────────────────────────────────────── */}
      <CheckboxField
        id="is_active"
        label="Active material"
        hint="Inactive materials are hidden from lists but their history is kept"
        checked={isActive.value}
        onChange={isActive.onChange}
      />

    </div>
  )
}
