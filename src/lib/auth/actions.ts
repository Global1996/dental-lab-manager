'use server'
// src/lib/auth/actions.ts
// Server Actions for authentication.
// These run on the server so they can safely use the server-side Supabase client.
// They are called from Client Components using the `action` prop or `startTransition`.


import { redirect } from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Sign the current user out and redirect to the login page.
 * Usage in a Client Component:
 *
 *   import { signOutAction } from '@/lib/auth/actions'
 *   <form action={signOutAction}><button type="submit">Sign out</button></form>
 */
export async function signOutAction() {
  const supabase = getServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Get the currently authenticated user's profile from the database.
 * Returns null if the user is not logged in or the profile doesn't exist yet.
 * Safe to call from any Server Component.
 */
export async function getCurrentProfile() {
  const supabase = getServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
