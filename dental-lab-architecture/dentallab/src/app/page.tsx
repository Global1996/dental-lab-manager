// src/app/page.tsx
// Root URL (/) — redirects to /dashboard if authenticated, else /login.
// The middleware handles this too, but this serves as an explicit fallback.

import { redirect } from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/dashboard' : '/login')
}
