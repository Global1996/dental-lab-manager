'use client'
// src/components/layout/Topbar.tsx
// Horizontal top bar: page title slot (empty by default),
// alerts bell, and user menu with sign-out.

import { useRouter } from 'next/navigation'
import { Bell, LogOut, UserCircle2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface Props { profile: Profile | null }

export function Topbar({ profile }: Props) {
  const router   = useRouter()
  const supabase = getSupabaseClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 shrink-0 border-b bg-card flex items-center justify-between px-6">
      {/* Left — page-specific breadcrumbs can be injected via a slot in future phases */}
      <div />

      {/* Right — actions */}
      <div className="flex items-center gap-1">

        {/* Alerts bell */}
        <button
          onClick={() => router.push('/alerts')}
          className="relative p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Alerts"
        >
          <Bell className="w-4 h-4" />
          {/* Unread indicator — wired up with real count in Phase 2 */}
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-2" />

        {/* User info + sign out */}
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-muted-foreground" />
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium leading-none">{profile?.full_name ?? 'User'}</p>
            <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{profile?.role ?? ''}</p>
          </div>
          <button
            onClick={signOut}
            className="ml-1 p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
