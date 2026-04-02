// src/app/(app)/layout.tsx
// Authenticated shell: sidebar + topbar + scrollable main content.
// Fetches the alert count server-side so the badge on the sidebar
// and topbar shows live numbers without a separate client fetch.

import { redirect } from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar }  from '@/components/layout/Topbar'

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

  // Compute alert count: low-stock + expiring within 30 days
  // Runs in parallel — cheap queries, both use indexed columns
  const today30   = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [lowStockRes, expiringRes] = await Promise.all([
    supabase
      .from('materials')
      .select('id, quantity, min_threshold', { count: 'exact' })
      .eq('is_active', true)
      .gt('min_threshold', 0),   // fetch only those with a threshold set
    supabase
      .from('materials')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', today30),
  ])

  // Count materials where quantity <= min_threshold (including zeros)
  const lowStockCount  = (lowStockRes.data ?? [])
    .filter(m => Number(m.quantity) <= Number(m.min_threshold)).length
  const expiringCount  = expiringRes.count ?? 0
  const alertCount     = lowStockCount + expiringCount

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
