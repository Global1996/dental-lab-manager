// src/app/api/auth/callback/route.ts
// Supabase sends users to this URL after they click the confirmation link
// in their email. This route exchanges the one-time token for a session.
//
// You must add this URL to your Supabase project:
//   Authentication → URL Configuration → Redirect URLs
//   Add: http://localhost:3000/api/auth/callback   (development)
//        https://yourdomain.com/api/auth/callback  (production)

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code  = searchParams.get('code')   // present on email confirmation
  const next  = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll:  () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to login with an error message
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
