// src/app/(app)/layout.tsx
// Authenticated shell. Fetches alert counts server-side via the alert lib
// so the badge in the sidebar and topbar is always accurate.

import { redirect }               from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { fetchAlerts }             from '@/lib/alerts/query'
import { Sidebar }                 from '@/components/layout/Sidebar'
import { Topbar }                  from '@/components/layout/Topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = getServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login?error=profile_missing')

  // Fetch alert summary using the centralised alert lib
  const { summary } = await fetchAlerts(supabase)
  const alertCount  = summary.critical + summary.warning  // don't count info-only in badge

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} alertCount={alertCount} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar profile={profile} alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
