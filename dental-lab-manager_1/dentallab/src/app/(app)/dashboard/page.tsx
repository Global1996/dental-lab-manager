// src/app/(app)/dashboard/page.tsx
// Dashboard — all queries run server-side in a single Promise.all.
// Uses the centralised alert lib for stock/expiry alerts.

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package2, CalendarClock, Briefcase,
  DollarSign, TrendingUp, ArrowLeftRight,
} from 'lucide-react'
import { getServerSupabaseClient }          from '@/lib/supabase/server'
import { fetchAlerts }                      from '@/lib/alerts/query'
import { StatCard }                         from '@/components/dashboard/StatCard'
import { RecentMovementsTable, type MovementSummary } from '@/components/dashboard/RecentMovementsTable'
import { TopMaterialsChart, type TopMaterialEntry }   from '@/components/dashboard/TopMaterialsChart'
import { AlertsPanel }                      from '@/components/alerts/AlertsPanel'
import { AlertsSummaryBar }                 from '@/components/alerts/AlertsSummaryBar'
import { CriticalAlertBanner }              from '@/components/alerts/CriticalAlertBanner'
import { DashboardErrorToast }              from './DashboardErrorToast'
import { formatCurrency }                   from '@/lib/utils'

export const metadata: Metadata = { title: 'Panou de control' }

interface Props { searchParams: { error?: string } }

export default async function DashboardPage({ searchParams }: Props) {
  const sb  = getServerSupabaseClient()
  const now = new Date()

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const in60days   = new Date(now.getTime() + 60 * 86_400_000).toISOString().split('T')[0]

  // ── All queries in parallel ──────────────────────────────────────────────
  const [
    { alerts, summary: alertSummary },
    materialsRes,
    recentMovementsRes,
    monthlyCasesRes,
    topUsageRes,
    openCasesRes,
  ] = await Promise.all([

    fetchAlerts(sb),

    sb.from('materials')
      .select('id, quantity, min_threshold, cost_per_unit')
      .eq('is_active', true),

    sb.from('stock_movements')
      .select('id, movement_type, quantity, unit_cost, reason, created_at, materials(name, unit)')
      .order('created_at', { ascending: false })
      .limit(8),

    sb.from('cases')
      .select('total_cost, final_price, estimated_profit')
      .in('status', ['completed', 'delivered'])
      .gte('created_at', monthStart),

    sb.from('case_material_usage')
      .select('quantity_used, unit_cost_at_time, materials(id, name, unit)')
      .gte('created_at', monthStart),

    sb.from('cases')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress', 'awaiting_approval']),
  ])

  // ── KPI computations ─────────────────────────────────────────────────────

  const materials     = (materialsRes.data ?? []) as any[]
  const totalMaterials = materials.length
  const inventoryValue = materials.reduce(
    (s: number, m: any) => s + Number(m.quantity) * Number(m.cost_per_unit), 0
  )

  const monthlyCases    = (monthlyCasesRes.data ?? []) as any[]
  const monthlyCaseCost = monthlyCases.reduce((s: number, c: any) => s + Number(c.total_cost), 0)
  const monthlyRevenue  = monthlyCases.reduce((s: number, c: any) => s + Number(c.final_price), 0)
  const monthlyProfit   = monthlyCases.reduce((s: number, c: any) => s + Number(c.estimated_profit), 0)
  const profitMargin    = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0
  const openCases       = openCasesRes.count ?? 0

  // ── Format recent movements ───────────────────────────────────────────────

  const recentMovements: MovementSummary[] = (recentMovementsRes.data ?? []).map((m: any) => ({
    id:            m.id,
    movement_type: m.movement_type,
    quantity:      Number(m.quantity),
    unit_cost:     m.unit_cost ? Number(m.unit_cost) : null,
    reason:        m.reason ?? null,
    created_at:    m.created_at,
    material_name: m.materials?.name ?? 'Necunoscut',
    material_unit: m.materials?.unit ?? '',
  }))

  // ── Top materials by usage ────────────────────────────────────────────────

  const usageMap = new Map<string, { name: string; unit: string; qty: number; value: number }>()
  for (const row of (topUsageRes.data ?? []) as any[]) {
    const id  = row.materials?.id
    if (!id) continue
    const existing = usageMap.get(id)
    const qty = Number(row.quantity_used)
    const val = qty * Number(row.unit_cost_at_time)
    if (existing) { existing.qty += qty; existing.value += val }
    else usageMap.set(id, { name: row.materials.name, unit: row.materials.unit, qty, value: val })
  }
  const topMaterials: TopMaterialEntry[] = [...usageMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
    .map(e => ({
      name:          e.name,
      quantity_used: Math.round(e.qty * 100) / 100,
      total_value:   Math.round(e.value * 100) / 100,
      unit:          e.unit,
    }))

  // ── Top critical alert message for the banner ─────────────────────────────
  const topCritical = alerts.find(a => a.severity === 'critical')

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-[1400px]">

      {searchParams.error === 'unauthorized' && (
        <DashboardErrorToast message="Nu aveți permisiunea de a accesa această pagină." />
      )}

      {/* Critical alert banner — only shown when there are critical issues */}
      {alertSummary.critical > 0 && (
        <CriticalAlertBanner
          criticalCount={alertSummary.critical}
          topMessage={topCritical?.message}
        />
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panou de control</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {now.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/alerts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm
                       font-medium hover:bg-accent transition-colors text-muted-foreground">
            Vezi toate alertele
          </Link>
          <Link href="/cases"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary
                       text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Briefcase className="w-3.5 h-3.5" />
            Cazuri
          </Link>
        </div>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Materiale"
          value={totalMaterials}
          icon={Package2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          sub="Active în catalog"
        />
        <StatCard
          label="Valoare Inventar"
          value={formatCurrency(inventoryValue)}
          icon={DollarSign}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          sub="La prețul de cost"
        />
        <StatCard
          label="Alerte Active"
          value={alertSummary.total}
          icon={CalendarClock}
          iconColor={alertSummary.critical > 0 ? 'text-red-600' : 'text-amber-600'}
          iconBg={alertSummary.critical > 0 ? 'bg-red-50' : 'bg-amber-50'}
          sub={alertSummary.critical > 0 ? `${alertSummary.critical} critice` : 'Fără probleme critice'}
          trend={alertSummary.critical > 0 ? 'down' : alertSummary.warning > 0 ? 'down' : 'neutral'}
          trendText={alertSummary.total > 0
            ? `${alertSummary.critical} critice · ${alertSummary.warning} avertismente`
            : 'Totul în regulă'}
        />
        <StatCard
          label="Cazuri Deschise"
          value={openCases}
          icon={Briefcase}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          sub="În desfășurare"
        />
        <StatCard
          label="Cost Lunar"
          value={formatCurrency(monthlyCaseCost)}
          icon={ArrowLeftRight}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          sub={`${monthlyCases.length} caz${monthlyCases.length !== 1 ? 'uri' : ''} finalizat${monthlyCases.length !== 1 ? 'e' : ''}`}
        />
        <StatCard
          label="Profit Lunar"
          value={formatCurrency(monthlyProfit)}
          icon={TrendingUp}
          iconColor={monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
          iconBg={monthlyProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
          sub={`${profitMargin.toFixed(1)}% marjă`}
          trend={monthlyProfit > 0 ? 'up' : monthlyProfit < 0 ? 'down' : 'neutral'}
          trendText={`Venituri: ${formatCurrency(monthlyRevenue)}`}
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: 2/3 */}
        <div className="xl:col-span-2 space-y-6">

          {/* Recent Movements */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Mișcări Recente de Stoc</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ultimele 8 tranzacții</p>
              </div>
              <Link href="/stock" className="text-xs text-primary font-medium hover:underline">
                Vezi toate
              </Link>
            </div>
            <div className="px-5 py-4">
              <RecentMovementsTable movements={recentMovements} />
            </div>
          </section>

          {/* Top Materials Chart */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-sm">Materiale Cel Mai Utilizate</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cantitate utilizată · {now.toLocaleString('ro-RO', { month: 'long' })}
              </p>
            </div>
            <div className="px-5 py-4">
              <TopMaterialsChart data={topMaterials} />
            </div>
          </section>

        </div>

        {/* Right: 1/3 — alerts panel */}
        <div>
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Alerte</h2>
                <div className="mt-1">
                  <AlertsSummaryBar summary={alertSummary} />
                </div>
              </div>
              <Link href="/alerts" className="text-xs text-primary font-medium hover:underline shrink-0">
                Vezi toate
              </Link>
            </div>
            <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
              <AlertsPanel
                alerts={alerts}
                variant="compact"
                maxPerGroup={4}
              />
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}
