// middleware.ts  (project root)
// Runs on every matched request before the page renders.
// Delegates to the Supabase session helper which also handles
// route protection (redirect unauthenticated users to /login).

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
