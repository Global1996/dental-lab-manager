// src/lib/audit.ts
// Lightweight audit log helper.
//
// Usage in any server action (after a successful DB write):
//
//   await writeAuditLog(supabase, user, {
//     action:       'create',
//     entity_type:  'material',
//     entity_id:    data.id,
//     entity_label: values.name,
//     details:      `Material "${values.name}" creat. Unitate: ${values.unit}.`,
//   })
//
// Fire-and-forget — never throws, never blocks the main response.
// A failed audit write is logged to console but does not fail the action.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { AuditAction, AuditEntityType } from '@/types'

interface AuditEntry {
  action:       AuditAction
  entity_type:  AuditEntityType
  entity_id?:   string | null
  entity_label?: string | null
  details?:     string | null
}

export async function writeAuditLog(
  // We accept `any` typed supabase here because the Database generic
  // doesn't know about audit_logs yet (no generated types for it).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  user: User,
  entry: AuditEntry,
): Promise<void> {
  // Fetch the user's display name from profiles.
  // We use a separate small query rather than passing the full profile
  // because not every action has the profile object in scope.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const user_name = profile?.full_name ?? user.email ?? 'Utilizator necunoscut'

  const { error } = await supabase.from('audit_logs').insert({
    user_id:      user.id,
    user_name,
    action:       entry.action,
    entity_type:  entry.entity_type,
    entity_id:    entry.entity_id    ?? null,
    entity_label: entry.entity_label ?? null,
    details:      entry.details      ?? null,
  })

  // Never crash the caller — just log locally if the insert fails
  if (error) {
    console.error('[audit] Failed to write audit log:', error.message)
  }
}
