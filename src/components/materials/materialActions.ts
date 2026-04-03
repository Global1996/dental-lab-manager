'use server'
// src/components/materials/materialActions.ts
// Server Actions for material CRUD (create, update, soft-delete).

import { revalidatePath }             from 'next/cache'
import { getServerSupabaseClient }     from '@/lib/supabase/server'
import { type ActionResult, mapDbError, notAuthenticated } from '@/lib/actions'
import { materialSchema, type MaterialFormValues } from './materialSchema'
import { writeAuditLog } from '@/lib/audit'

export type { ActionResult }

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createMaterial(values: MaterialFormValues): Promise<ActionResult> {
  const parsed = materialSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { data, error } = await supabase
    .from('materials')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'create',
    entity_type:  'material',
    entity_id:    data.id,
    entity_label: parsed.data.name,
    details:      `Material creat: "${parsed.data.name}", unitate: ${parsed.data.unit}, cost: ${parsed.data.cost_per_unit}.`,
  })

  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { success: true, id: data.id }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateMaterial(id: string, values: MaterialFormValues): Promise<ActionResult> {
  const parsed = materialSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { error } = await supabase
    .from('materials')
    .update(parsed.data)
    .eq('id', id)

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'update',
    entity_type:  'material',
    entity_id:    id,
    entity_label: parsed.data.name,
    details:      `Material actualizat: "${parsed.data.name}". Cost: ${parsed.data.cost_per_unit}, prag minim: ${parsed.data.min_threshold}.`,
  })

  revalidatePath('/materials')
  return { success: true }
}

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────

export async function deleteMaterial(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  // Fetch name before deleting so we can log it
  const { data: mat } = await supabase
    .from('materials')
    .select('name')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('materials')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'delete',
    entity_type:  'material',
    entity_id:    id,
    entity_label: mat?.name ?? id,
    details:      `Material dezactivat: "${mat?.name ?? id}".`,
  })

  revalidatePath('/materials')
  return { success: true }
}
