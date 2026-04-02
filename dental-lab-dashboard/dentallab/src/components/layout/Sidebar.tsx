'use client'
// src/components/layout/Sidebar.tsx
// Left navigation. Active-route highlighting. Role-gated links.
// Accepts alertCount prop to show badge on the Dashboard link.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package2, ArrowLeftRight,
  Briefcase, BarChart3, AlertTriangle, Users2, ChevronRight, FlaskConical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavItem {
  label:  string
  href:   string
  icon:   React.ElementType
  roles?: Array<'admin' | 'manager' | 'technician'>
}

const NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Materials',  href: '/materials',  icon: Package2 },
  { label: 'Stock',      href: '/stock',      icon: ArrowLeftRight },
  { label: 'Cases',      href: '/cases',      icon: Briefcase },
  { label: 'Reports',    href: '/reports',    icon: BarChart3 },
  { label: 'Users',      href: '/users',      icon: Users2, roles: ['admin'] },
]

interface Props {
  profile:    Profile | null
  alertCount?: number   // low-stock + expiring count for the badge
}

export function Sidebar({ profile, alertCount = 0 }: Props) {
  const pathname = usePathname()

  const visible = NAV.filter(item =>
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  )

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-card">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center
                        text-primary-foreground text-xs font-bold shrink-0 shadow-sm">
          <FlaskConical className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none truncate">Dental Lab</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visible.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const showBadge = href === '/dashboard' && alertCount > 0

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
              <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                active && 'text-primary'
              )} />
              <span className="flex-1 truncate">{label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full
                                 bg-red-500 text-white text-[10px] font-bold">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
              {active && !showBadge && (
                <ChevronRight className="w-3 h-3 opacity-40" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Alerts summary strip */}
      {alertCount > 0 && (
        <div className="mx-3 mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
            <p className="text-xs font-semibold text-red-700">
              {alertCount} alert{alertCount !== 1 ? 's' : ''} need attention
            </p>
          </div>
        </div>
      )}

      {/* Profile footer */}
      {profile && (
        <div className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center
                            text-primary text-xs font-bold shrink-0">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{profile.full_name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
