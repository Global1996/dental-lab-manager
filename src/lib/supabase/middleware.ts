// src/lib/supabase/middleware.ts
// Called from the root middleware.ts on every request.
// Refreshes the Supabase session and enforces route-level auth.
// Wrapped in try/catch so a misconfigured Supabase environment
// never crashes the edge middleware and returns a Vercel 404.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  // Guard: if env vars are missing, pass the request through rather than crashing.
  // This prevents Vercel returning 404 NOT_FOUND when env vars are not yet configured.
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnon,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    // Always call getUser() — this refreshes the session token
    const { data: { user } } = await supabase.auth.getUser()

    const path         = request.nextUrl.pathname
    const isAuthPath   = path.startsWith('/login') || path.startsWith('/register')
    const isApiPath    = path.startsWith('/api/')
    const isPublicPath = isAuthPath || isApiPath

    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }

    if (user && isAuthPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch {
    // Supabase threw (e.g. invalid URL format, network error at edge).
    // Let the request proceed — Next.js pages handle their own auth checks.
  }

  return response
}
