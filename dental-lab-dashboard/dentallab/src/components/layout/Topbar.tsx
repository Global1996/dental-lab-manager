'use client'
// src/components/layout/Topbar.tsx
// Top header bar with current page title, alert badge, and user menu.

import { useRouter, usePathname } from 'next/navigation'
import { Bell, LogOut, ChevronDown, AlertTriangle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

// Map of href → page title shown in the topbar breadcrumb
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/materials':  'Materials',
  '/stock':      'Stock Movements',
  '/cases':      'Cases',
  '/reports':    'Reports',
  '/users':      'Users',
}

function getPageTitle(pathname: string): string {
  for (const [key, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + '/')) return label
  }
  return 'Dental Lab'
}

interface Props {
  profile:    Profile | null
  alertCount?: number
}

export function Topbar({ profile, alertCount = 0 }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const title    = getPageTitle(pathname)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 shrink-0 border-b bg-card/95 backdrop-blur-sm
                        flex items-center justify-between px-5 sticky top-0 z-10">

      {/* Left: page title */}
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      {/* Right: alerts + user */}
      <div className="flex items-center gap-1">

        {/* Alerts */}
        <button
          onClick={() => router.push('/dashboard')}
          className="relative p-2 rounded-md text-muted-foreground hover:bg-accent
                     hover:text-foreground transition-colors"
          aria-label="Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                             bg-red-500 text-white text-[9px] font-bold
                             flex items-center justify-center leading-none">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1.5" />

        {/* User */}
        <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-accent transition-colors cursor-default">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center
                          text-primary text-xs font-bold shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none">{profile?.full_name ?? 'User'}</p>
            <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{profile?.role ?? ''}</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent
                     hover:text-foreground transition-colors ml-0.5"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
