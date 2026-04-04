'use client'
import { useRouter, usePathname } from 'next/navigation'
import { Bell, LogOut } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Panou de control',
  '/materials':       'Materiale',
  '/stock':           'Mișcări de stoc',
  '/cases':           'Cazuri',
  '/reports':         'Rapoarte',
  '/alerts':          'Alerte',
  '/suppliers':       'Furnizori',
  '/purchase-orders': 'Comenzi de Achiziție',
  '/audit':           'Jurnal de activitate',
  '/users':           'Utilizatori',
}

const ROLE_LABEL: Record<string, string> = {
  admin:      'Administrator',
  manager:    'Manager',
  technician: 'Tehnician',
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

      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-1">
        <button
          onClick={() => router.push('/alerts')}
          className="relative p-2 rounded-md text-muted-foreground hover:bg-accent
                     hover:text-foreground transition-colors"
          aria-label="Alerte"
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

        <div className="w-px h-5 bg-border mx-1.5" />

        <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-accent transition-colors cursor-default">
          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center
                          text-primary text-xs font-bold shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-none">{profile?.full_name ?? 'Utilizator'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {ROLE_LABEL[profile?.role ?? ''] ?? profile?.role ?? ''}
            </p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-accent
                     hover:text-foreground transition-colors ml-0.5"
          aria-label="Deconectare"
          title="Deconectare"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
