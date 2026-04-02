'use client'
// src/app/(preview)/PreviewSidebar.tsx
// Sidebar for the preview shell. Mirrors the real Sidebar exactly
// but requires no profile prop or Supabase session.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package2, ArrowLeftRight,
  Briefcase, BarChart3, ChevronRight, FlaskConical,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/preview/dashboard', icon: LayoutDashboard },
  { label: 'Materials',  href: '/preview/materials',  icon: Package2 },
  { label: 'Stock',      href: '/preview/stock',      icon: ArrowLeftRight },
  { label: 'Cases',      href: '/preview/cases',      icon: Briefcase },
  { label: 'Reports',    href: '/preview/reports',    icon: BarChart3 },
]

export function PreviewSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-card">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center
                        text-primary-foreground shrink-0 shadow-sm">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none truncate">Dental Lab</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">
            Manager
          </p>
        </div>
      </div>

      {/* Preview banner */}
      <div className="mx-2 mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
          Preview Mode
        </p>
        <p className="text-[10px] text-amber-600 mt-0.5">Mock data · No DB required</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]'
                  : 'text-muted-foreground hover:bg-accent/80 hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                active && 'text-primary'
              )} />
              <span className="flex-1 truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Alert strip — mock 3 alerts */}
      <div className="mx-3 mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-700">3 alerts need attention</p>
        </div>
      </div>

      {/* Mock profile footer */}
      <div className="px-4 py-3 border-t bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center
                          text-primary text-xs font-bold shrink-0">
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">Admin User</p>
            <p className="text-[10px] text-muted-foreground capitalize">admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
