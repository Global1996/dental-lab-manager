'use server'
// src/components/stock/stockActions.ts
// Server Actions for stock movements (in, out, adjustment).

import { revalidatePath }             from 'next/cache'
import { getServerSupabaseClient }     from '@/lib/supabase/server'
import { type ActionResult, mapDbError, notAuthenticated } from '@/lib/actions'
import {
  stockInSchema, stockOutSchema, stockAdjustmentSchema,
  type StockInValues, type StockOutValues, type StockAdjustmentValues,
} from './stockSchema'
import { writeAuditLog } from '@/lib/audit'

export type { ActionResult }

function revalidateStock(caseId?: string | null) {
  revalidatePath('/stock')
  revalidatePath('/materials')
  revalidatePath('/dashboard')
  if (caseId) revalidatePath(`/cases/${caseId}`)
}

// ─── Stock In ─────────────────────────────────────────────────────────────────

export async function recordStockIn(values: StockInValues): Promise<ActionResult> {
  const parsed = stockInSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const d = parsed.data

  // Fetch material name for the log
  const { data: mat } = await supabase
    .from('materials')
    .select('name')
    .eq('id', d.material_id)
    .single()

  const { error } = await supabase.from('stock_movements').insert({
    material_id:   d.material_id,
    movement_type: 'in',
    quantity:      d.quantity,
    unit_cost:     d.unit_cost ?? null,
    batch_number:  d.batch_number ?? null,
    expiry_date:   d.expiry_date ?? null,
    reason:        [d.reason, d.notes].filter(Boolean).join(' — ') || null,
  })

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'stock_in',
    entity_type:  'stock_movement',
    entity_id:    d.material_id,
    entity_label: mat?.name ?? d.material_id,
    details:      `Intrare stoc: +${d.quantity} unități din "${mat?.name ?? d.material_id}". Cost: ${d.unit_cost ?? '—'}.${d.reason ? ` Motiv: ${d.reason}.` : ''}`,
  })

  revalidateStock()
  return { success: true }
}

// ─── Stock Out ────────────────────────────────────────────────────────────────

export async function recordStockOut(values: StockOutValues): Promise<ActionResult> {
  const parsed = stockOutSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const d = parsed.data

  const { data: mat } = await supabase
    .from('materials')
    .select('name')
    .eq('id', d.material_id)
    .single()

  const { error } = await supabase.from('stock_movements').insert({
    material_id:   d.material_id,
    movement_type: 'out',
    quantity:      d.quantity,
    case_id:       d.case_id ?? null,
    reason:        [d.reason, d.notes].filter(Boolean).join(' — ') || null,
  })

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'stock_out',
    entity_type:  'stock_movement',
    entity_id:    d.material_id,
    entity_label: mat?.name ?? d.material_id,
    details:      `Ieșire stoc: −${d.quantity} unități din "${mat?.name ?? d.material_id}".${d.reason ? ` Motiv: ${d.reason}.` : ''}`,
  })

  revalidateStock(d.case_id)
  return { success: true }
}

// ─── Adjustment ───────────────────────────────────────────────────────────────

export async function recordAdjustment(values: StockAdjustmentValues): Promise<ActionResult> {
  const parsed = stockAdjustmentSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const { delta, material_id, reason, notes } = parsed.data
  const isIncrease = delta > 0

  const { data: mat } = await supabase
    .from('materials')
    .select('name')
    .eq('id', material_id)
    .single()

  const { error } = await supabase.from('stock_movements').insert({
    material_id,
    movement_type: isIncrease ? 'adjustment' : 'out',
    quantity:      Math.abs(delta),
    reason:        [reason, notes].filter(Boolean).join(' — ') || null,
  })

  if (error) return mapDbError(error)

  await writeAuditLog(supabase, user, {
    action:       'adjustment',
    entity_type:  'stock_movement',
    entity_id:    material_id,
    entity_label: mat?.name ?? material_id,
    details:      `Ajustare stoc: ${delta > 0 ? '+' : ''}${delta} unități pentru "${mat?.name ?? material_id}". Motiv: ${reason}.`,
  })

  revalidateStock()
  return { success: true }
}
