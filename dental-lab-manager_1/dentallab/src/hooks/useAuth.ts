'use client'
// src/hooks/useAuth.ts
// Provides the current Supabase user + profile and listens for auth state changes.
// Use in any Client Component that needs role-gating or user identity.

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface AuthState {
  user:       User | null
  profile:    Profile | null
  isLoading:  boolean
  isAdmin:    boolean
  isManager:  boolean  // admin OR manager
}

export function useAuth(): AuthState {
  const supabase = getSupabaseClient()
  const [user,      setUser]      = useState<User | null>(null)
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data ?? null)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadProfile(user.id).finally(() => setIsLoading(false))
      else setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else { setProfile(null); setIsLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

  return {
    user,
    profile,
    isLoading,
    isAdmin:   profile?.role === 'admin',
    isManager: profile?.role === 'admin' || profile?.role === 'manager',
  }
}
