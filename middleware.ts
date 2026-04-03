// middleware.ts  (project root)
// Runs on every matched request before the page renders.
// Delegates to the Supabase session helper for auth-protected routes.
// /preview/* is explicitly excluded — it works without any DB setup.

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Preview routes bypass all auth checks — they use mock data only
  if (request.nextUrl.pathname.startsWith('/preview')) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
