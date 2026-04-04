// src/lib/actions.ts
// Shared utilities for all Server Actions.
//
// WHY THIS FILE EXISTS:
//   Before this refactor, every action file (materialActions, caseActions,
//   stockActions) had its own copy of `ActionResult` and a `dbError()` helper.
//   They were slightly different from each other, which was a bug waiting to
//   happen. This single file is now the one place to update error handling.

// ─── ActionResult ─────────────────────────────────────────────────────────────
// Every Server Action returns this shape so the client can show a toast.
// The `id` field is only present on create operations.

export type ActionResult =
  | { success: true;  id?: string }
  | { success: false; error: string }

// ─── DB error mapper ──────────────────────────────────────────────────────────
// Maps Postgres error codes to beginner-friendly messages.
// Called by every action's error path.

interface DbError {
  code?:    string
  message:  string
}

export function mapDbError(error: DbError): ActionResult {
  switch (error.code) {
    case '23505':
      return { success: false, error: 'Există deja o înregistrare cu această valoare (duplicat).' }
    case '23503':
      return { success: false, error: 'Această înregistrare este referențiată de alte date și nu poate fi ștearsă.' }
    case '23514':
      // CHECK constraint violation — usually a stock guard
      if (error.message.includes('stock') || error.message.includes('quantity')) {
        return { success: false, error: 'Stoc insuficient pentru această operațiune.' }
      }
      return { success: false, error: 'Valoarea introdusă încalcă o regulă a bazei de date.' }
    case 'P0004':
      // Raised by the fn_prevent_negative_stock trigger
      return { success: false, error: 'Stoc insuficient pentru această operațiune.' }
    default:
      // Catch insufficient stock messages from other triggers
      if (error.message?.toLowerCase().includes('insufficient stock')) {
        return { success: false, error: 'Stoc insuficient pentru această operațiune.' }
      }
      return { success: false, error: error.message }
  }
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Convenience for the repetitive "not authenticated" check in every action.

export function notAuthenticated(): ActionResult {
  return { success: false, error: 'Trebuie să fiți autentificat pentru a efectua această acțiune.' }
}
