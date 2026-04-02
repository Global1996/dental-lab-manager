// src/app/(app)/dashboard/page.tsx
// Dashboard — fully data-driven. All queries run server-side in parallel.
// Real column names from 001_schema_and_seed.sql:
//   materials:       quantity, min_threshold, cost_per_unit, expiry_date
//   stock_movements: created_at (not performed_at), reason, case_id
//   cases:           material_cost, labor_cost, machine_cost, total_cost,
//                    final_price, estimated_profit

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package2, AlertTriangle, CalendarClock,
  Briefcase, DollarSign, TrendingUp,
  ArrowLeftRight, ShieldAlert,
} from 'lucide-react'
import { getServerSupabaseClient }        from '@/lib/supabase/server'
import { StatCard }                        from '@/components/dashboard/StatCard'
import { LowStockWidget, type LowStockItem }     from '@/components/dashboard/LowStockWidget'
import { ExpiringMaterialsWidget, type ExpiringItem } from '@/components/dashboard/ExpiringMaterialsWidget'
import { RecentMovementsTable, type MovementSummary } from '@/components/dashboard/RecentMovementsTable'
import { TopMaterialsChart, type TopMaterialEntry }   from '@/components/dashboard/TopMaterialsChart'
import { DashboardErrorToast }             from './DashboardErrorToast'
import { formatCurrency }                  from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

interface Props { searchParams: { error?: string } }

export default async function DashboardPage({ searchParams }: Props) {
  const sb = getServerSupabaseClient()

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const in60days   = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0]
  const today      = now.toISOString().split('T')[0]

  // ── All queries in parallel ──────────────────────────────────────────────

  const [
    materialsRes,
    recentMovementsRes,
    monthlyCasesRes,
    topUsageRes,
    expiringRes,
    openCasesRes,
  ] = await Promise.all([

    // All active materials — we use these for multiple KPIs
    sb
      .from('materials')
      .select('id, name, sku, quantity, min_threshold, cost_per_unit, expiry_date, location, unit, category_id, is_active, categories(id, name, color)')
      .eq('is_active', true)
      .order('name'),

    // 8 most recent movements with joined material name
    sb
      .from('stock_movements')
      .select('id, movement_type, quantity, unit_cost, reason, case_id, created_at, materials(name, unit)')
      .order('created_at', { ascending: false })
      .limit(8),

    // Cases completed or delivered this calendar month
    sb
      .from('cases')
      .select('material_cost, labor_cost, machine_cost, total_cost, final_price, estimated_profit')
      .in('status', ['completed', 'delivered'])
      .gte('created_at', monthStart),

    // Top 8 materials by total quantity used this month
    sb
      .from('case_material_usage')
      .select('quantity_used, unit_cost_at_time, materials(id, name, unit)')
      .gte('created_at', monthStart),

    // Materials expiring within 60 days (including already-expired)
    sb
      .from('materials')
      .select('id, name, sku, expiry_date, quantity, unit')
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', in60days)
      .order('expiry_date'),

    // Open case count
    sb
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress', 'awaiting_approval']),
  ])

  // ── Compute KPIs ─────────────────────────────────────────────────────────

  const materials = (materialsRes.data ?? []) as any[]

  const totalMaterials   = materials.length
  const inventoryValue   = materials.reduce((s: number, m: any) =>
    s + Number(m.quantity) * Number(m.cost_per_unit), 0)
  const lowStockItems    = materials.filter((m: any) =>
    Number(m.quantity) > 0 && Number(m.quantity) <= Number(m.min_threshold)
  )
  const outOfStockCount  = materials.filter((m: any) => Number(m.quantity) <= 0).length
  const expiringItems    = (expiringRes.data ?? []) as any[]

  const monthlyCases     = (monthlyCasesRes.data ?? []) as any[]
  const monthlyCaseCost  = monthlyCases.reduce((s: number, c: any) => s + Number(c.total_cost), 0)
  const monthlyRevenue   = monthlyCases.reduce((s: number, c: any) => s + Number(c.final_price), 0)
  const monthlyProfit    = monthlyCases.reduce((s: number, c: any) => s + Number(c.estimated_profit), 0)
  const profitMargin     = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0

  const openCases = openCasesRes.count ?? 0

  // ── Format RecentMovements ────────────────────────────────────────────────

  const recentMovements: MovementSummary[] = (recentMovementsRes.data ?? []).map((m: any) => ({
    id:            m.id,
    movement_type: m.movement_type,
    quantity:      Number(m.quantity),
    unit_cost:     m.unit_cost ? Number(m.unit_cost) : null,
    reason:        m.reason ?? null,
    created_at:    m.created_at,
    material_name: m.materials?.name ?? 'Unknown',
    material_unit: m.materials?.unit ?? '',
  }))

  // ── Format LowStockItems ─────────────────────────────────────────────────

  const lowStockDisplay: LowStockItem[] = lowStockItems.map((m: any) => ({
    id:             m.id,
    name:           m.name,
    sku:            m.sku,
    quantity:       Number(m.quantity),
    min_threshold:  Number(m.min_threshold),
    unit:           m.unit,
    cost_per_unit:  Number(m.cost_per_unit),
    category_name:  m.categories?.name ?? null,
    category_color: m.categories?.color ?? null,
  }))

  // Out-of-stock shown separately in low-stock widget (prepended)
  const outOfStockItems: LowStockItem[] = materials
    .filter((m: any) => Number(m.quantity) <= 0)
    .map((m: any) => ({
      id:             m.id,
      name:           m.name,
      sku:            m.sku,
      quantity:       0,
      min_threshold:  Number(m.min_threshold),
      unit:           m.unit,
      cost_per_unit:  Number(m.cost_per_unit),
      category_name:  m.categories?.name ?? null,
      category_color: m.categories?.color ?? null,
    }))

  const allAlerts: LowStockItem[] = [...outOfStockItems, ...lowStockDisplay].slice(0, 8)

  // ── Format ExpiringItems ─────────────────────────────────────────────────

  const expiringDisplay: ExpiringItem[] = expiringItems.map((m: any) => ({
    id:          m.id,
    name:        m.name,
    sku:         m.sku,
    expiry_date: m.expiry_date,
    quantity:    Number(m.quantity),
    unit:        m.unit,
  }))

  // ── Top materials by usage this month ────────────────────────────────────

  const usageRaw = (topUsageRes.data ?? []) as any[]
  const usageMap  = new Map<string, { name: string; unit: string; qty: number; value: number }>()

  for (const row of usageRaw) {
    const id   = row.materials?.id
    const name = row.materials?.name ?? 'Unknown'
    const unit = row.materials?.unit ?? ''
    const qty  = Number(row.quantity_used)
    const val  = qty * Number(row.unit_cost_at_time)

    if (!id) continue
    const existing = usageMap.get(id)
    if (existing) {
      existing.qty   += qty
      existing.value += val
    } else {
      usageMap.set(id, { name, unit, qty, value: val })
    }
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Error toasts from requireRole() redirects */}
      {searchParams.error === 'unauthorized' && (
        <DashboardErrorToast message="You do not have permission to access that page." />
      )}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Live overview · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/stock"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       text-sm font-medium hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Stock
          </Link>
          <Link href="/cases"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       bg-primary text-primary-foreground text-sm font-medium
                       hover:bg-primary/90 transition-colors">
            <Briefcase className="w-3.5 h-3.5" />
            Cases
          </Link>
        </div>
      </div>

      {/* ── KPI stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Materials"
          value={totalMaterials}
          icon={Package2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          sub={`${outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'All in stock'}`}
          trend={outOfStockCount > 0 ? 'down' : 'neutral'}
          trendText={outOfStockCount > 0 ? `${outOfStockCount} need restocking` : 'No stockouts'}
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(inventoryValue)}
          icon={DollarSign}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          sub="At purchase price"
        />
        <StatCard
          label="Low Stock"
          value={lowStockItems.length + outOfStockCount}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          sub={outOfStockCount > 0 ? `${outOfStockCount} out of stock` : 'Above zero'}
          trend={lowStockItems.length + outOfStockCount > 0 ? 'down' : 'neutral'}
          trendText={lowStockItems.length + outOfStockCount > 0
            ? `${lowStockItems.length} low · ${outOfStockCount} out`
            : 'All levels OK'}
        />
        <StatCard
          label="Expiring Soon"
          value={expiringItems.length}
          icon={CalendarClock}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
          sub="Within 60 days"
          trend={expiringItems.length > 0 ? 'down' : 'neutral'}
          trendText={expiringItems.length > 0 ? `${expiringItems.length} item${expiringItems.length !== 1 ? 's' : ''} expiring` : 'None expiring soon'}
        />
        <StatCard
          label="Monthly Cost"
          value={formatCurrency(monthlyCaseCost)}
          icon={ArrowLeftRight}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          sub={`${monthlyCases.length} case${monthlyCases.length !== 1 ? 's' : ''} · ${openCases} open`}
        />
        <StatCard
          label="Monthly Profit"
          value={formatCurrency(monthlyProfit)}
          icon={TrendingUp}
          iconColor={monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
          iconBg={monthlyProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
          sub={`${profitMargin.toFixed(1)}% margin`}
          trend={monthlyProfit > 0 ? 'up' : monthlyProfit < 0 ? 'down' : 'neutral'}
          trendText={`Rev: ${formatCurrency(monthlyRevenue)}`}
        />
      </div>

      {/* ── Main content grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column: takes 2/3 of xl width */}
        <div className="xl:col-span-2 space-y-6">

          {/* Recent Movements */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Recent Stock Movements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Last 8 transactions across all materials</p>
              </div>
              <Link href="/stock"
                className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
                View all
              </Link>
            </div>
            <div className="px-5 py-4">
              <RecentMovementsTable movements={recentMovements} />
            </div>
          </section>

          {/* Top Materials Chart */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Top Used Materials</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  By quantity consumed across cases · {new Date().toLocaleString('en-US', { month: 'long' })}
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <TopMaterialsChart data={topMaterials} />
            </div>
          </section>

        </div>

        {/* Right column: takes 1/3 of xl width */}
        <div className="space-y-6">

          {/* Low Stock Alerts */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Stock Alerts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {allAlerts.length > 0
                    ? `${allAlerts.length} item${allAlerts.length !== 1 ? 's' : ''} need attention`
                    : 'All levels healthy'
                  }
                </p>
              </div>
              {allAlerts.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                 bg-red-100 text-red-600 text-xs font-bold">
                  {allAlerts.length}
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              <LowStockWidget items={allAlerts} />
            </div>
          </section>

          {/* Expiring Materials */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Expiring Materials</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expiringDisplay.length > 0
                    ? `${expiringDisplay.length} item${expiringDisplay.length !== 1 ? 's' : ''} within 60 days`
                    : 'No upcoming expirations'
                  }
                </p>
              </div>
              {expiringDisplay.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                                 bg-orange-100 text-orange-600 text-xs font-bold">
                  {expiringDisplay.length}
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              <ExpiringMaterialsWidget items={expiringDisplay} />
            </div>
          </section>

        </div>
      </div>

    </div>
  )
}
