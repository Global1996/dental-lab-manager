'use server'
// src/components/materials/materialActions.ts
// Server Actions for material CRUD.
// These run on the server, so they have direct access to the DB via the
// server-side Supabase client (which uses the user's session + RLS).
//
// Each action returns an ActionResult so the client can show success/error toasts.

import { revalidatePath } from 'next/cache'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { materialSchema, type MaterialFormValues } from './materialSchema'

export type ActionResult =
  | { success: true;  id?: string }
  | { success: false; error: string }

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createMaterial(
  values: MaterialFormValues
): Promise<ActionResult> {
  // Re-validate on the server (never trust client-side validation alone)
  const parsed = materialSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = getServerSupabaseClient()

  // Get the current user's ID to set created_by
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('materials')
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    // Friendly message for the most common DB error (duplicate SKU)
    if (error.code === '23505') {
      return { success: false, error: 'A material with this SKU already exists.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/materials')
  return { success: true, id: data.id }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateMaterial(
  id: string,
  values: MaterialFormValues
): Promise<ActionResult> {
  const parsed = materialSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = getServerSupabaseClient()

  const { error } = await supabase
    .from('materials')
    .update(parsed.data)
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A material with this SKU already exists.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/materials')
  return { success: true }
}

// ─── DELETE (soft) ───────────────────────────────────────────────────────────
// We soft-delete by setting is_active = false so historical stock movements
// and case usage records that reference this material stay intact.

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()

  const { error } = await supabase
    .from('materials')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/materials')
  return { success: true }
}
