'use server'
// src/components/stock/stockActions.ts
// Server Actions for stock movements (in, out, adjustment).
//
// Architecture notes:
//   - We insert a row into stock_movements; the DB trigger fn_sync_stock_level
//     updates stock_levels automatically.
//   - The trigger fn_prevent_negative_stock raises an exception (ERRCODE P0004 /
//     check_violation) before the insert if stock would go negative.
//   - We catch that exception and return a friendly error string.
//   - adjustment movements always insert movement_type='adjustment' with a
//     POSITIVE quantity; the sign in fn_sync_stock_level is always +ve for
//     adjustments, so for a REDUCTION we insert movement_type='out' instead.

import { revalidatePath } from 'next/cache'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import {
  stockInSchema,
  stockOutSchema,
  stockAdjustmentSchema,
  type StockInValues,
  type StockOutValues,
  type StockAdjustmentValues,
} from './stockSchema'

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

// Helper: map Postgres error codes to user-friendly messages
function dbError(error: { code?: string; message: string }): ActionResult {
  if (error.code === 'P0004' || error.code === '23514' || error.message?.includes('Insufficient stock')) {
    return { success: false, error: 'Not enough stock available for this operation.' }
  }
  if (error.code === '23503') {
    return { success: false, error: 'The selected material or case no longer exists.' }
  }
  return { success: false, error: error.message }
}

// ─── Stock In ─────────────────────────────────────────────────────────────────

export async function recordStockIn(values: StockInValues): Promise<ActionResult> {
  const parsed = stockInSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('stock_movements').insert({
    material_id:    parsed.data.material_id,
    movement_type:  'in',
    quantity:       parsed.data.quantity,
    unit_cost:      parsed.data.unit_cost ?? null,
    batch_number:   parsed.data.batch_number ?? null,
    expiry_date:    parsed.data.expiry_date ?? null,
    reference_type: 'manual',
    notes:          [parsed.data.reason, parsed.data.notes].filter(Boolean).join(' — ') || null,
    performed_by:   user.id,
  })

  if (error) return dbError(error)

  revalidatePath('/stock')
  revalidatePath('/materials')   // stock level badge updates
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Stock Out ────────────────────────────────────────────────────────────────

export async function recordStockOut(values: StockOutValues): Promise<ActionResult> {
  const parsed = stockOutSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('stock_movements').insert({
    material_id:    parsed.data.material_id,
    movement_type:  'out',
    quantity:       parsed.data.quantity,
    unit_cost:      null,
    reference_id:   parsed.data.case_id ?? null,
    reference_type: parsed.data.case_id ? 'case' : 'manual',
    notes:          [parsed.data.reason, parsed.data.notes].filter(Boolean).join(' — ') || null,
    performed_by:   user.id,
  })

  if (error) return dbError(error)

  revalidatePath('/stock')
  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Adjustment ───────────────────────────────────────────────────────────────
// The user provides a signed delta (+10 = add 10, -5 = remove 5).
// We split into movement_type + positive quantity for the DB.

export async function recordAdjustment(values: StockAdjustmentValues): Promise<ActionResult> {
  const parsed = stockAdjustmentSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { delta, material_id, reason, notes } = parsed.data
  const isIncrease = delta > 0

  // For a reduction, we use movement_type='out' so the DB trigger
  // fn_prevent_negative_stock correctly guards against going below zero.
  const movement_type = isIncrease ? 'adjustment' : 'out'
  const quantity      = Math.abs(delta)

  const { error } = await supabase.from('stock_movements').insert({
    material_id,
    movement_type,
    quantity,
    unit_cost:      null,
    reference_type: 'adjustment',
    notes:          [reason, notes].filter(Boolean).join(' — ') || null,
    performed_by:   user.id,
  })

  if (error) return dbError(error)

  revalidatePath('/stock')
  revalidatePath('/materials')
  revalidatePath('/dashboard')
  return { success: true }
}
