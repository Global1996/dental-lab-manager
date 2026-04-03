'use client'
// src/components/purchase-orders/CreatePoDialog.tsx
// Modal to create a new purchase order with one or more line items.
//
// Flow:
//   1. User picks a supplier (optional) and sets the order date.
//   2. User adds line items by either picking a material from the dropdown
//      (which auto-fills name/unit) or typing a free-text material name.
//   3. Each line item has: material, quantity, unit cost (optional), notes.
//   4. On submit, the server action creates the order header + items atomically.

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, ClipboardList, Loader2, X, PackagePlus } from 'lucide-react'
import { poSchema, emptyItem, PO_STATUS_OPTIONS, type PoFormValues } from './poSchema'
import { createPurchaseOrder } from './poActions'
import { FieldWrapper, Input, Textarea } from '@/components/ui/FormField'
import type { Supplier, Material } from '@/types'

interface Props {
  suppliers: Supplier[]
  materials: Material[]
}

export function CreatePoDialog({ suppliers, materials }: Props) {
  const [open, setOpen] = useState(false)

  const {
    register, control, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<PoFormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      supplier_id:   null,
      order_date:    new Date().toISOString().slice(0, 10),
      expected_date: null,
      notes:         null,
      items:         [emptyItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  async function onSubmit(values: PoFormValues) {
    const result = await createPurchaseOrder(values)
    if (!result.success) { toast.error(result.error); return }
    toast.success('Comandă de achiziție creată', {
      description: `Număr comandă va fi atribuit automat`,
    })
    reset()
    setOpen(false)
  }

  function handleClose() {
    if (isSubmitting) return
    reset()
    setOpen(false)
  }

  // When a material is selected from the dropdown, auto-fill name + unit
  function onMaterialSelect(index: number, materialId: string) {
    const mat = materials.find(m => m.id === materialId)
    if (!mat) return
    setValue(`items.${index}.material_id`, mat.id)
    setValue(`items.${index}.material_name`, mat.name)
    setValue(`items.${index}.unit`, mat.unit)
    // Pre-fill unit cost from catalog price
    if (mat.cost_per_unit > 0) {
      setValue(`items.${index}.unit_cost`, mat.cost_per_unit)
    }
  }

  const itemErrors = errors.items

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                   text-sm font-medium text-primary-foreground shadow-sm
                   hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Comandă nouă
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-po-title"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col
                       rounded-2xl border bg-background shadow-2xl overflow-hidden"
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 id="create-po-title" className="text-base font-semibold">
                    Comandă de achiziție nouă
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Numărul comenzii se atribuie automat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                           hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable body ────────────────────────────────────────── */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">

              {/* ── Order header ──────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase
                               tracking-wider mb-3">
                  Detalii comandă
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Supplier */}
                  <FieldWrapper label="Furnizor" htmlFor="po_supplier">
                    <select
                      {...register('supplier_id')}
                      id="po_supplier"
                      className="flex h-9 w-full rounded-md border bg-background px-3 py-1
                                 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring
                                 cursor-pointer"
                    >
                      <option value="">— Fără furnizor —</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </FieldWrapper>

                  {/* Order date */}
                  <FieldWrapper
                    label="Data comenzii"
                    htmlFor="po_date"
                    required
                    error={errors.order_date?.message}
                  >
                    <Input
                      {...register('order_date')}
                      id="po_date"
                      type="date"
                      error={!!errors.order_date}
                    />
                  </FieldWrapper>

                  {/* Expected delivery */}
                  <FieldWrapper
                    label="Data estimată de livrare"
                    htmlFor="po_expected"
                    error={errors.expected_date?.message}
                  >
                    <Input
                      {...register('expected_date')}
                      id="po_expected"
                      type="date"
                    />
                  </FieldWrapper>

                  {/* Notes */}
                  <FieldWrapper
                    label="Observații"
                    htmlFor="po_notes"
                    error={errors.notes?.message}
                    className="sm:col-span-2"
                  >
                    <Textarea
                      {...register('notes')}
                      id="po_notes"
                      placeholder="Instrucțiuni de livrare, referință internă…"
                      rows={2}
                    />
                  </FieldWrapper>
                </div>
              </div>

              {/* ── Line items ────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase
                               tracking-wider mb-3">
                  Materiale comandate
                </p>

                {typeof itemErrors === 'object' && !Array.isArray(itemErrors) && (itemErrors as any)?.message && (
                  <p className="text-xs text-destructive mb-2 flex items-center gap-1">
                    <span>⚠</span> {(itemErrors as any).message}
                  </p>
                )}

                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const rowErrors = itemErrors?.[index]
                    return (
                      <div
                        key={field.id}
                        className="rounded-xl border bg-muted/20 p-4 space-y-3 relative"
                      >
                        {/* Remove button — only shown when there are >1 items */}
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="absolute top-3 right-3 p-1 rounded-md
                                       hover:bg-destructive/10 text-muted-foreground
                                       hover:text-destructive transition-colors"
                            aria-label="Elimină linia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">

                          {/* Material picker (optional) */}
                          <FieldWrapper
                            label="Material din catalog"
                            htmlFor={`items.${index}.material_id`}
                          >
                            <select
                              id={`items.${index}.material_id`}
                              onChange={e => onMaterialSelect(index, e.target.value)}
                              className="flex h-9 w-full rounded-md border bg-background px-3
                                         py-1 text-sm shadow-sm focus:outline-none
                                         focus:ring-2 focus:ring-ring cursor-pointer"
                            >
                              <option value="">— Selectează sau scrie manual —</option>
                              {materials.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name}{m.sku ? ` · ${m.sku}` : ''}
                                </option>
                              ))}
                            </select>
                            {/* Hidden field for the actual material_id value */}
                            <input type="hidden" {...register(`items.${index}.material_id`)} />
                          </FieldWrapper>

                          {/* Free-text material name */}
                          <FieldWrapper
                            label="Denumire material"
                            htmlFor={`items.${index}.material_name`}
                            required
                            error={rowErrors?.material_name?.message}
                          >
                            <Input
                              {...register(`items.${index}.material_name`)}
                              id={`items.${index}.material_name`}
                              placeholder="ex. IPS e.max CAD Block A2"
                              error={!!rowErrors?.material_name}
                            />
                          </FieldWrapper>

                          {/* Unit */}
                          <FieldWrapper
                            label="Unitate"
                            htmlFor={`items.${index}.unit`}
                            required
                            error={rowErrors?.unit?.message}
                          >
                            <Input
                              {...register(`items.${index}.unit`)}
                              id={`items.${index}.unit`}
                              placeholder="ex. piece, ml, g"
                              error={!!rowErrors?.unit}
                            />
                          </FieldWrapper>

                          {/* Quantity */}
                          <FieldWrapper
                            label="Cantitate"
                            htmlFor={`items.${index}.quantity_ordered`}
                            required
                            error={rowErrors?.quantity_ordered?.message}
                          >
                            <Input
                              {...register(`items.${index}.quantity_ordered`, { valueAsNumber: true })}
                              id={`items.${index}.quantity_ordered`}
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              placeholder="1"
                              error={!!rowErrors?.quantity_ordered}
                            />
                          </FieldWrapper>

                          {/* Unit cost */}
                          <FieldWrapper
                            label="Preț unitar (RON)"
                            htmlFor={`items.${index}.unit_cost`}
                            error={rowErrors?.unit_cost?.message}
                            hint="Opțional — prețul negociat cu furnizorul"
                          >
                            <Input
                              {...register(`items.${index}.unit_cost`, {
                                valueAsNumber: true,
                                setValueAs: v => v === '' ? null : Number(v),
                              })}
                              id={`items.${index}.unit_cost`}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                            />
                          </FieldWrapper>

                          {/* Item notes */}
                          <FieldWrapper
                            label="Observații linie"
                            htmlFor={`items.${index}.notes`}
                            error={rowErrors?.notes?.message}
                          >
                            <Input
                              {...register(`items.${index}.notes`)}
                              id={`items.${index}.notes`}
                              placeholder="Specificații, lot, culoare…"
                            />
                          </FieldWrapper>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add line button */}
                <button
                  type="button"
                  onClick={() => append(emptyItem())}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg
                             border border-dashed text-sm text-muted-foreground
                             hover:text-foreground hover:border-border transition-colors w-full
                             justify-center"
                >
                  <PackagePlus className="w-4 h-4" />
                  Adaugă material
                </button>
              </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 px-6 py-4
                            border-t bg-muted/30 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border text-sm font-medium
                           hover:bg-accent transition-colors disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-primary text-primary-foreground text-sm font-medium
                           hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Se creează…' : 'Creează comanda'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
