'use server'
// src/components/suppliers/supplierActions.ts
// Server Actions for supplier CRUD.
// Follows the exact same pattern as materialActions.ts.

import { revalidatePath }                                from 'next/cache'
import { getServerSupabaseClient }                       from '@/lib/supabase/server'
import { type ActionResult, mapDbError, notAuthenticated } from '@/lib/actions'
import { supplierSchema, type SupplierFormValues }       from './supplierSchema'

export type { ActionResult }

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createSupplier(values: SupplierFormValues): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { data, error } = await supabase
    .from('suppliers')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return mapDbError(error)

  revalidatePath('/suppliers')
  revalidatePath('/materials')   // supplier dropdown in AddMaterialDialog refreshes
  return { success: true, id: data.id }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateSupplier(
  id: string,
  values: SupplierFormValues,
): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()

  const { error } = await supabase
    .from('suppliers')
    .update(parsed.data)
    .eq('id', id)

  if (error) return mapDbError(error)

  revalidatePath('/suppliers')
  revalidatePath('/materials')
  return { success: true }
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────
// Sets is_active = false.
// Materials that reference this supplier keep their supplier_id — they just
// won't appear in future supplier dropdowns until reassigned.

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()

  // Check if any active materials are still linked to this supplier
  const { count } = await supabase
    .from('materials')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', id)
    .eq('is_active', true)

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `Furnizorul este asociat cu ${count} material${count === 1 ? '' : 'e'} active. Reatribuiți materialele înainte de a dezactiva furnizorul.`,
    }
  }

  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return mapDbError(error)

  revalidatePath('/suppliers')
  revalidatePath('/materials')
  return { success: true }
}
