'use server'
// src/components/purchase-orders/poActions.ts
// Server Actions for Purchase Orders.
//
// Key design decisions:
//   - order_number is generated here (PO-YYYY-NNNN) because we need
//     the current count before inserting.
//   - "Mark as received" inserts stock_movements explicitly (one per item)
//     rather than using a DB trigger — clearer, auditable, transactional.
//   - Items are stored with a material_name/unit snapshot so the PO
//     stays readable even if a material is later renamed or deleted.

import { revalidatePath }                                  from 'next/cache'
import { getServerSupabaseClient }                         from '@/lib/supabase/server'
import { type ActionResult, mapDbError, notAuthenticated } from '@/lib/actions'
import { poSchema, type PoFormValues, type PoStatus }      from './poSchema'

export type { ActionResult }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function revalidateAll() {
  revalidatePath('/purchase-orders')
  revalidatePath('/stock')
  revalidatePath('/materials')
  revalidatePath('/dashboard')
}

/** Generate next order number: PO-2024-0001 */
async function nextOrderNumber(sb: ReturnType<typeof getServerSupabaseClient>): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `PO-${year}-`

  const { count } = await sb
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .like('order_number', `${prefix}%`)

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `${prefix}${seq}`
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createPurchaseOrder(values: PoFormValues): Promise<ActionResult> {
  const parsed = poSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  const order_number = await nextOrderNumber(supabase)

  // Insert header
  const { data: order, error: orderErr } = await supabase
    .from('purchase_orders')
    .insert({
      order_number,
      supplier_id:   parsed.data.supplier_id ?? null,
      status:        'draft',
      order_date:    parsed.data.order_date,
      expected_date: parsed.data.expected_date ?? null,
      notes:         parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (orderErr || !order) return mapDbError(orderErr ?? { message: 'Eroare la creare comandă.' })

  // Insert line items
  const items = parsed.data.items.map(item => ({
    purchase_order_id: order.id,
    material_id:       item.material_id ?? null,
    material_name:     item.material_name,
    unit:              item.unit,
    quantity_ordered:  item.quantity_ordered,
    unit_cost:         item.unit_cost ?? null,
    notes:             item.notes ?? null,
  }))

  const { error: itemsErr } = await supabase
    .from('purchase_order_items')
    .insert(items)

  if (itemsErr) return mapDbError(itemsErr)

  revalidateAll()
  return { success: true, id: order.id }
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────

export async function updatePoStatus(
  id: string,
  status: PoStatus,
): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()

  const patch: Record<string, unknown> = { status }
  if (status === 'received') patch.received_date = new Date().toISOString().slice(0, 10)

  const { error } = await supabase
    .from('purchase_orders')
    .update(patch)
    .eq('id', id)

  if (error) return mapDbError(error)

  revalidateAll()
  return { success: true }
}

// ─── MARK RECEIVED + UPDATE STOCK ────────────────────────────────────────────
// Called when the user marks an order as "received" AND checks
// "Update stock". Inserts one stock_movement per line item.

export async function receiveOrderAndUpdateStock(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notAuthenticated()

  // 1. Fetch the order + items
  const { data: order, error: orderErr } = await supabase
    .from('purchase_orders')
    .select('id, order_number, status, purchase_order_items(material_id, material_name, unit, quantity_ordered, unit_cost)')
    .eq('id', id)
    .single()

  if (orderErr || !order) {
    return { success: false, error: 'Comanda nu a fost găsită.' }
  }

  if (order.status === 'received') {
    return { success: false, error: 'Comanda a fost deja recepționată.' }
  }

  const items = (order as any).purchase_order_items as {
    material_id: string | null
    material_name: string
    unit: string
    quantity_ordered: number
    unit_cost: number | null
  }[]

  // Only insert movements for items that are linked to a real material
  const movementsToInsert = items
    .filter(item => item.material_id !== null)
    .map(item => ({
      material_id:   item.material_id!,
      movement_type: 'in' as const,
      quantity:      Number(item.quantity_ordered),
      unit_cost:     item.unit_cost ?? null,
      reason:        `Recepție comandă ${(order as any).order_number}`,
    }))

  if (movementsToInsert.length > 0) {
    const { error: mvErr } = await supabase
      .from('stock_movements')
      .insert(movementsToInsert)

    if (mvErr) return mapDbError(mvErr)
  }

  // 2. Mark order as received
  const today = new Date().toISOString().slice(0, 10)
  const { error: updateErr } = await supabase
    .from('purchase_orders')
    .update({ status: 'received', received_date: today })
    .eq('id', id)

  if (updateErr) return mapDbError(updateErr)

  revalidateAll()
  return { success: true }
}

// ─── UPDATE NOTES / DATES ─────────────────────────────────────────────────────

export async function updatePurchaseOrder(
  id: string,
  patch: { notes?: string | null; expected_date?: string | null; supplier_id?: string | null },
): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()

  const { error } = await supabase
    .from('purchase_orders')
    .update(patch)
    .eq('id', id)

  if (error) return mapDbError(error)

  revalidateAll()
  return { success: true }
}

// ─── DELETE (draft only) ──────────────────────────────────────────────────────

export async function deletePurchaseOrder(id: string): Promise<ActionResult> {
  const supabase = getServerSupabaseClient()

  // Only allow deleting drafts — anything else has business meaning
  const { data: order } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (!order) return { success: false, error: 'Comanda nu a fost găsită.' }
  if (order.status !== 'draft') {
    return { success: false, error: 'Doar comenzile de tip „Schiță" pot fi șterse.' }
  }

  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('id', id)

  if (error) return mapDbError(error)

  revalidateAll()
  return { success: true }
}
