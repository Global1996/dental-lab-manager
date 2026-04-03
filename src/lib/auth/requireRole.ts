// src/lib/auth/requireRole.ts
// Server-side role guard.
// Call this at the top of any Server Component or Route Handler
// that should be restricted to specific roles.
//
// Usage examples:
//
//   // Only admins can access this page
//   await requireRole('admin')
//
//   // Admins or managers can access this page
//   await requireRole(['admin', 'manager'])
//
// If the user is unauthenticated → redirects to /login
// If the user lacks the required role → redirects to /dashboard with an error

import { redirect } from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export async function requireRole(
  allowed: UserRole | UserRole[]
) {
  const supabase = getServerSupabaseClient()

  // 1. Check session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch profile for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile not created yet (unlikely — the DB trigger handles it)
    redirect('/login')
  }

  // 3. Check role
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed]
  if (!allowedRoles.includes(profile.role as UserRole)) {
    // Redirect to dashboard with a message — the dashboard will show an error toast
    redirect('/dashboard?error=unauthorized')
  }

  return profile
}
