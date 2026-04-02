// src/app/page.tsx
// Root route — redirects to preview during local development.
// When real Supabase credentials are configured, change this to:
//   redirect(user ? '/dashboard' : '/login')

import { redirect } from 'next/navigation'

export default function RootPage() {
  // During preview: go straight to the mock dashboard (no DB needed)
  // Once Supabase is set up: replace with auth check + redirect to /dashboard or /login
  redirect('/preview/dashboard')
}
