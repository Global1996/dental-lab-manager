'use client'
// src/components/layout/Sidebar.tsx
// Left navigation sidebar. Highlights the active route.
// Role-gates the Users link so only admins see it.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package2, ArrowLeftRight,
  Briefcase, BarChart3, Bell, Users2, ChevronRight,
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
  { label: 'Stock',      href: '/stock',       icon: ArrowLeftRight },
  { label: 'Cases',      href: '/cases',       icon: Briefcase },
  { label: 'Reports',    href: '/reports',     icon: BarChart3 },
  { label: 'Alerts',     href: '/alerts',      icon: Bell },
  { label: 'Users',      href: '/users',       icon: Users2, roles: ['admin'] },
]

interface Props { profile: Profile | null }

export function Sidebar({ profile }: Props) {
  const pathname = usePathname()

  const visible = NAV.filter(item =>
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  )

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-card">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          DL
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none truncate">Dental Lab</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Manager</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {visible.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile footer */}
      {profile && (
        <div className="px-4 py-3 border-t">
          <p className="text-xs font-medium truncate">{profile.full_name}</p>
          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{profile.role}</p>
        </div>
      )}
    </aside>
  )
}
