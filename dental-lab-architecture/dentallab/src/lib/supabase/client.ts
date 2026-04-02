// src/lib/supabase/client.ts
// Browser-side Supabase client — used in 'use client' components and hooks.
// A singleton is returned so React doesn't create a new client on every render.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
