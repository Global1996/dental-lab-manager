'use server'
// src/components/cases/caseActions.ts
// Server Actions for cases and case_material_usage.

import { revalidatePath }             from 'next/cache'
import { getServerSupabaseClient }     from '@/lib/supabase/server'
import { type ActionResult, mapDbError, notAuthenticated } from '@/lib/actions'
import { caseSchema, addMaterialUsageSchema, type CaseFormValues, type AddMaterialUsageValues } from './caseSchema'
import { writeAuditLog } from '@/lib/audit'

export type { ActionResult }

// ─── CREATE case ─────────────────────────────────────────────────────────────

export async function createCase(values: CaseFormValues): Promise<ActionResult> {
  const parsed = caseSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { data, error } = await supabase
    .from('cases')
    .insert(parsed.data)
    .select('id, case_code')
    .single()

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'create',
    entity_type:  'case',
    entity_id:    data.id,
    entity_label: data.case_code,
    details:      `Caz creat pentru pacient: "${parsed.data.patient_name}". Tip: ${parsed.data.work_type}, status: ${parsed.data.status}.`,
  })

  revalidatePath('/cases')
  revalidatePath('/dashboard')
  return { success: true, id: data.id }
}

// ─── UPDATE case ─────────────────────────────────────────────────────────────

export async function updateCase(id: string, values: CaseFormValues): Promise<ActionResult> {
  const parsed = caseSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  // Fetch current case to detect status change
  const { data: existing } = await supabase
    .from('cases')
    .select('case_code, status')
    .eq('id', id)
    .single()

  const {
    patient_name, clinic_name, doctor_name, work_type, status,
    tooth_numbers, shade, received_date, due_date, completed_date,
    labor_cost, machine_cost, final_price, notes,
  } = parsed.data

  const { error } = await supabase
    .from('cases')
    .update({
      patient_name, clinic_name, doctor_name, work_type, status,
      tooth_numbers, shade, received_date, due_date, completed_date,
      labor_cost, machine_cost, final_price, notes,
    })
    .eq('id', id)

  if (error) return mapDbError(error)

  // Build a concise details string
  const parts: string[] = [`Caz actualizat: "${existing?.case_code ?? id}".`]
  if (existing?.status && existing.status !== status) {
    parts.push(`Status: ${existing.status} → ${status}.`)
  }
  parts.push(`Preț final: ${final_price}. Pacient: "${patient_name}".`)

  await writeAuditLog(supabase, user, {
    action:       'update',
    entity_type:  'case',
    entity_id:    id,
    entity_label: existing?.case_code ?? id,
    details:      parts.join(' '),
  })

  revalidatePath('/cases')
  revalidatePath(`/cases/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── SOFT DELETE case ────────────────────────────────────────────────────────

export async function deleteCase(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { data: existing } = await supabase
    .from('cases')
    .select('case_code')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('cases')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'delete',
    entity_type:  'case',
    entity_id:    id,
    entity_label: existing?.case_code ?? id,
    details:      `Caz anulat: "${existing?.case_code ?? id}".`,
  })

  revalidatePath('/cases')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── ADD material to case ────────────────────────────────────────────────────

export async function addMaterialToCase(
  caseId: string,
  values: AddMaterialUsageValues,
): Promise<ActionResult> {
  const parsed = addMaterialUsageSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { data: material, error: matErr } = await supabase
    .from('materials')
    .select('cost_per_unit, name, quantity')
    .eq('id', parsed.data.material_id)
    .single()

  if (matErr || !material) {
    return { success: false, error: 'Material negăsit.' }
  }

  const available = Number(material.quantity)
  const requested = Number(parsed.data.quantity_used)
  if (requested > available) {
    return {
      success: false,
      error: `Stoc insuficient pentru "${material.name}". Disponibil: ${available}, solicitat: ${requested}.`,
    }
  }

  const { data: caseData } = await supabase
    .from('cases')
    .select('case_code')
    .eq('id', caseId)
    .single()

  const { error } = await supabase
    .from('case_material_usage')
    .insert({
      case_id:           caseId,
      material_id:       parsed.data.material_id,
      quantity_used:     parsed.data.quantity_used,
      unit_cost_at_time: Number(material.cost_per_unit),
      notes:             parsed.data.notes ?? null,
    })

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'update',
    entity_type:  'case',
    entity_id:    caseId,
    entity_label: caseData?.case_code ?? caseId,
    details:      `Material adăugat la caz "${caseData?.case_code ?? caseId}": "${material.name}" × ${requested} unități.`,
  })

  revalidatePath(`/cases/${caseId}`)
  revalidatePath('/stock')
  return { success: true }
}

// ─── REMOVE material from case ───────────────────────────────────────────────

export async function removeMaterialFromCase(
  caseId: string,
  usageId: string,
): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  // Fetch before deleting so we can log what was removed
  const { data: usage } = await supabase
    .from('case_material_usage')
    .select('quantity_used, materials(name), cases(case_code)')
    .eq('id', usageId)
    .single()

  const { error } = await supabase
    .from('case_material_usage')
    .delete()
    .eq('id', usageId)
    .eq('case_id', caseId)

  if (error) return mapDbError(error)

  const matName   = (usage?.materials as any)?.name   ?? 'material'
  const caseCode  = (usage?.cases     as any)?.case_code ?? caseId

  await writeAuditLog(supabase, user, {
    action:       'update',
    entity_type:  'case',
    entity_id:    caseId,
    entity_label: caseCode,
    details:      `Material eliminat din caz "${caseCode}": "${matName}" × ${usage?.quantity_used ?? ''} unități.`,
  })

  revalidatePath(`/cases/${caseId}`)
  return { success: true }
}
