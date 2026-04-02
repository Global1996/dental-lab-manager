'use client'
// src/app/(preview)/PreviewTopbar.tsx
// Topbar for the preview shell. No sign-out, no real alert count.

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/preview/dashboard': 'Dashboard',
  '/preview/materials': 'Materials',
  '/preview/stock':     'Stock Movements',
  '/preview/cases':     'Cases',
  '/preview/reports':   'Reports',
}

export function PreviewTopbar() {
  const pathname = usePathname()
  const title = Object.entries(PAGE_TITLES).find(
    ([key]) => pathname === key || pathname.startsWith(key + '/')
  )?.[1] ?? 'Dental Lab'

  return (
    <header className="h-14 shrink-0 border-b bg-card/95 backdrop-blur-sm
                        flex items-center justify-between px-5 sticky top-0 z-10">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Mock alert bell */}
        <button className="relative p-2 rounded-md text-muted-foreground hover:bg-accent
                           hover:text-foreground transition-colors" aria-label="Alerts">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                           bg-red-500 text-white text-[9px] font-bold
                           flex items-center justify-center leading-none">
            3
          </span>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Mock user */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center
                          text-primary text-xs font-bold shrink-0">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none">Admin User</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">admin · preview</p>
          </div>
        </div>
      </div>
    </header>
  )
}
