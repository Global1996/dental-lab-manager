// src/app/(preview)/dashboard/page.tsx
// Preview dashboard — full UI with realistic mock data.
// No Supabase calls. Every component is the real production component.
// Replace this page with the real dashboard/page.tsx once DB is set up.

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Package2, CalendarClock, Briefcase,
  DollarSign, TrendingUp, ArrowLeftRight,
} from 'lucide-react'
import { StatCard }                from '@/components/dashboard/StatCard'
import { RecentMovementsTable }    from '@/components/dashboard/RecentMovementsTable'
import { TopMaterialsChart }       from '@/components/dashboard/TopMaterialsChart'
import { AlertsPanel }             from '@/components/alerts/AlertsPanel'
import { AlertsSummaryBar }        from '@/components/alerts/AlertsSummaryBar'
import { CriticalAlertBanner }     from '@/components/alerts/CriticalAlertBanner'
import { formatCurrency }          from '@/lib/utils'
import type { MovementSummary }    from '@/components/dashboard/RecentMovementsTable'
import type { TopMaterialEntry }   from '@/components/dashboard/TopMaterialsChart'
import type { Alert, AlertSummary } from '@/lib/alerts/types'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── Mock data ────────────────────────────────────────────────────────────────
// All dates relative to now so the "X minutes ago" display always looks fresh.

const now = new Date()
const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000).toISOString()

const MOCK_MOVEMENTS: MovementSummary[] = [
  { id: '1', movement_type: 'in',         quantity: 50,  unit_cost: 8.40,  reason: 'Monthly restock', created_at: minsAgo(12),  material_name: 'IPS e.max CAD A2',       material_unit: 'piece' },
  { id: '2', movement_type: 'case_usage', quantity: 3,   unit_cost: null,  reason: null,              created_at: minsAgo(47),  material_name: 'Vita Zirconia HT',       material_unit: 'g'     },
  { id: '3', movement_type: 'out',        quantity: 5,   unit_cost: null,  reason: 'Damaged on trim', created_at: minsAgo(95),  material_name: 'Temporary Crown Resin',  material_unit: 'piece' },
  { id: '4', movement_type: 'in',         quantity: 200, unit_cost: 0.45,  reason: null,              created_at: minsAgo(180), material_name: 'Impression Putty Base',  material_unit: 'ml'    },
  { id: '5', movement_type: 'adjustment', quantity: 2,   unit_cost: null,  reason: 'Stocktake correction', created_at: minsAgo(310), material_name: 'IPS e.max CAD A2', material_unit: 'piece' },
  { id: '6', movement_type: 'case_usage', quantity: 8,   unit_cost: null,  reason: null,              created_at: minsAgo(420), material_name: 'Zirconia Disc 98mm',     material_unit: 'g'     },
  { id: '7', movement_type: 'return',     quantity: 10,  unit_cost: 2.10,  reason: 'Supplier return', created_at: minsAgo(600), material_name: 'Metal Bond Ceramic',     material_unit: 'g'     },
  { id: '8', movement_type: 'expired',    quantity: 4,   unit_cost: null,  reason: 'Past expiry date',created_at: minsAgo(900), material_name: 'Impression Alginate',    material_unit: 'pack'  },
]

const MOCK_TOP_MATERIALS: TopMaterialEntry[] = [
  { name: 'IPS e.max CAD A2',      quantity_used: 42, total_value: 352.80, unit: 'piece' },
  { name: 'Vita Zirconia HT',      quantity_used: 380, total_value: 228.00, unit: 'g'    },
  { name: 'Zirconia Disc 98mm',    quantity_used: 210, total_value: 315.00, unit: 'g'    },
  { name: 'Impression Putty',      quantity_used: 180, total_value: 81.00,  unit: 'ml'   },
  { name: 'Temp Crown Resin',      quantity_used: 28,  total_value: 196.00, unit: 'piece'},
  { name: 'Metal Bond Ceramic',    quantity_used: 95,  total_value: 142.50, unit: 'g'    },
  { name: 'Wax Pattern Material',  quantity_used: 120, total_value: 60.00,  unit: 'g'    },
  { name: 'Resin Cement A2',       quantity_used: 15,  total_value: 89.25,  unit: 'syringe'},
]

const MOCK_ALERTS: Alert[] = [
  {
    id: 'stock-1',
    kind: 'out_of_stock',
    severity: 'critical',
    title: 'Out of Stock',
    message: 'Impression Alginate has zero units remaining. Reorder threshold is 5 pack.',
    material: { id: 'mat-1', name: 'Impression Alginate', sku: 'IMP-ALG-500', unit: 'pack', quantity: 0, min_threshold: 5, expiry_date: null, location: 'Shelf A2', category_name: 'Impression' },
  },
  {
    id: 'expiry-1',
    kind: 'expired',
    severity: 'critical',
    title: 'Expired',
    message: 'Temporary Composite expired 3 days ago (Dec 28, 2024). Remove from inventory.',
    material: { id: 'mat-2', name: 'Temporary Composite', sku: 'TMP-COMP-A2', unit: 'syringe', quantity: 6, min_threshold: 2, expiry_date: '2024-12-28', location: 'Fridge F1', category_name: 'Composite' },
    days_until_expiry: -3,
  },
  {
    id: 'stock-2',
    kind: 'low_stock',
    severity: 'warning',
    title: 'Low Stock',
    message: 'IPS e.max CAD A2 has 4 piece remaining (80% of minimum threshold 5 piece).',
    material: { id: 'mat-3', name: 'IPS e.max CAD A2', sku: 'IPS-EMAXCAD-A2', unit: 'piece', quantity: 4, min_threshold: 5, expiry_date: null, location: 'Cabinet C1', category_name: 'Ceramic' },
    stock_percent: 80,
  },
  {
    id: 'expiry-2',
    kind: 'expiring_soon',
    severity: 'warning',
    title: 'Expiring Soon',
    message: 'Resin Cement A2 expires in 18 days (Jan 18, 2025).',
    material: { id: 'mat-4', name: 'Resin Cement A2', sku: 'RES-CEM-A2', unit: 'syringe', quantity: 3, min_threshold: 2, expiry_date: '2025-01-18', location: 'Shelf B3', category_name: 'Cements' },
    days_until_expiry: 18,
  },
]

const MOCK_ALERT_SUMMARY: AlertSummary = {
  total: 4, critical: 2, warning: 2, info: 0,
}

// ─── KPI values ───────────────────────────────────────────────────────────────

const TOTAL_MATERIALS   = 47
const INVENTORY_VALUE   = 12_840.50
const OPEN_CASES        = 9
const MONTHLY_COST      = 4_210.80
const MONTHLY_REVENUE   = 7_350.00
const MONTHLY_PROFIT    = MONTHLY_REVENUE - MONTHLY_COST
const PROFIT_MARGIN     = (MONTHLY_PROFIT / MONTHLY_REVENUE) * 100

// ─────────────────────────────────────────────────────────────────────────────

export default function PreviewDashboardPage() {
  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-[1400px]">

      {/* Critical alert banner */}
      <CriticalAlertBanner
        criticalCount={2}
        topMessage="Impression Alginate has zero units remaining. Reorder threshold is 5 pack."
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {month}
            <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium
                             text-amber-700 bg-amber-50 border border-amber-200
                             px-2 py-0.5 rounded-full">
              ✦ Preview — mock data
            </span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/preview/alerts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm
                       font-medium hover:bg-accent transition-colors text-muted-foreground">
            View all alerts
          </Link>
          <Link href="/preview/cases"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary
                       text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Briefcase className="w-3.5 h-3.5" />
            Cases
          </Link>
        </div>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Materials"
          value={TOTAL_MATERIALS}
          icon={Package2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          sub="Active in catalogue"
          trend="neutral"
          trendText="No stockouts"
        />
        <StatCard
          label="Inventory Value"
          value={formatCurrency(INVENTORY_VALUE)}
          icon={DollarSign}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          sub="At cost price"
        />
        <StatCard
          label="Active Alerts"
          value={MOCK_ALERT_SUMMARY.total}
          icon={CalendarClock}
          iconColor="text-red-600"
          iconBg="bg-red-50"
          sub="2 critical"
          trend="down"
          trendText="2 critical · 2 warning"
        />
        <StatCard
          label="Open Cases"
          value={OPEN_CASES}
          icon={Briefcase}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          sub="In progress"
        />
        <StatCard
          label="Monthly Cost"
          value={formatCurrency(MONTHLY_COST)}
          icon={ArrowLeftRight}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          sub="14 completed cases"
        />
        <StatCard
          label="Monthly Profit"
          value={formatCurrency(MONTHLY_PROFIT)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          sub={`${PROFIT_MARGIN.toFixed(1)}% margin`}
          trend="up"
          trendText={`Revenue: ${formatCurrency(MONTHLY_REVENUE)}`}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: 2/3 */}
        <div className="xl:col-span-2 space-y-6">

          {/* Recent movements */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Recent Stock Movements</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Last 8 transactions</p>
              </div>
              <Link href="/preview/stock" className="text-xs text-primary font-medium hover:underline">
                View all
              </Link>
            </div>
            <div className="px-5 py-4">
              <RecentMovementsTable movements={MOCK_MOVEMENTS} />
            </div>
          </section>

          {/* Top materials chart */}
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20">
              <h2 className="font-semibold text-sm">Top Used Materials</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                By quantity consumed · {now.toLocaleString('en-US', { month: 'long' })}
              </p>
            </div>
            <div className="px-5 py-4">
              <TopMaterialsChart data={MOCK_TOP_MATERIALS} />
            </div>
          </section>

        </div>

        {/* Right: 1/3 */}
        <div>
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <h2 className="font-semibold text-sm">Alerts</h2>
                <div className="mt-1">
                  <AlertsSummaryBar summary={MOCK_ALERT_SUMMARY} />
                </div>
              </div>
              <Link href="/preview/alerts" className="text-xs text-primary font-medium hover:underline shrink-0">
                View all
              </Link>
            </div>
            <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
              <AlertsPanel
                alerts={MOCK_ALERTS}
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
