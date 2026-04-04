'use client'
// src/app/(app)/reports/ReportsClient.tsx
// Interactive reports: date range filter + all charts + KPI cards.
// All filtering is client-side for instant feedback.

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line,
} from 'recharts'
import {
  TrendingUp, DollarSign, Package2,
  BarChart3, Calendar,
} from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { WORK_TYPE_OPTIONS } from '@/components/cases/caseSchema'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseRow {
  id: string; case_code: string; status: string; work_type: string
  created_at: string; completed_date: string | null; received_date: string
  total_cost: number; final_price: number; estimated_profit: number
  material_cost: number; labor_cost: number; machine_cost: number
  profit_margin_pct: number
}

interface UsageRow {
  quantity_used: number; unit_cost_at_time: number; total_cost: number
  created_at: string
  materials: { id: string; name: string; unit: string } | null
}

interface StockRow {
  id: string; name: string; quantity: number; cost_per_unit: number
  unit: string; categories: { name: string } | null
}

interface Props { cases: CaseRow[]; usage: UsageRow[]; stock: StockRow[] }

// ─── Palette ──────────────────────────────────────────────────────────────────

const PAL = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#14b8a6','#10b981','#f59e0b','#ef4444','#0ea5e9']

// ─── Small helpers ────────────────────────────────────────────────────────────


function ymd(iso: string) { return iso.slice(0,10) }
function monthKey(iso: string) { return iso.slice(0,7) }

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m)-1).toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })
}

const workLabel = (v: string) =>
  WORK_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v

// ─── Tooltip wrappers ─────────────────────────────────────────────────────────

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2.5 text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

function PctTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2.5 text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatPercent(p.value)}</p>
      ))}
    </div>
  )
}


// ─── Date range helpers ───────────────────────────────────────────────────────

type Range = '30d' | '90d' | '6m' | '12m' | 'all'

const RANGE_LABELS: Record<Range, string> = {
  '30d':  'Ultimele 30 zile',
  '90d':  'Ultimele 90 zile',
  '6m':   'Ultimele 6 luni',
  '12m':  'Ultimele 12 luni',
  'all':  'Tot timpul',
}

function rangeStart(r: Range): string {
  const now = new Date()
  if (r === 'all') return '2000-01-01'
  const days = r === '30d' ? 30 : r === '90d' ? 90 : r === '6m' ? 180 : 365
  now.setDate(now.getDate() - days)
  return ymd(now.toISOString())
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportsClient({ cases, usage, stock }: Props) {
  const [range, setRange] = useState<Range>('all')
  const start = rangeStart(range)

  // ── Filter cases by date ──────────────────────────────────────────────
  const filteredCases = useMemo(() =>
    cases.filter(c => ymd(c.created_at) >= start),
    [cases, start]
  )

  const completedCases = useMemo(() =>
    filteredCases.filter(c => c.status === 'completed' || c.status === 'delivered'),
    [filteredCases]
  )

  const filteredUsage = useMemo(() =>
    usage.filter(u => ymd(u.created_at) >= start),
    [usage, start]
  )

  // ── KPI totals ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const rev    = completedCases.reduce((s: number, c: CaseRow) => s + Number(c.final_price),      0)
    const cost   = completedCases.reduce((s: number, c: CaseRow) => s + Number(c.total_cost),       0)
    const profit = completedCases.reduce((s: number, c: CaseRow) => s + Number(c.estimated_profit), 0)
    const mat    = completedCases.reduce((s: number, c: CaseRow) => s + Number(c.material_cost),    0)
    const margin = rev > 0 ? (profit / rev) * 100 : 0
    const stockVal = stock.reduce((s: number, m: StockRow) => s + Number(m.quantity) * Number(m.cost_per_unit), 0)
    return { rev, cost, profit, mat, margin, stockVal, n: completedCases.length, open: filteredCases.filter((c: CaseRow) => ['draft','in_progress','awaiting_approval'].includes(c.status)).length }
  }, [completedCases, filteredCases, stock])

  // ── Monthly revenue + cost trend ──────────────────────────────────────
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { venituri: number; costuri: number; profit: number; marja: number }>()
    for (const c of completedCases as CaseRow[]) {
      const k = monthKey(c.created_at)
      const e = map.get(k) ?? { venituri: 0, costuri: 0, profit: 0, marja: 0 }
      e.venituri += Number(c.final_price)
      e.costuri  += Number(c.total_cost)
      e.profit   += Number(c.estimated_profit)
      map.set(k, e)
    }
    return [...map.entries()]
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({
        luna: monthLabel(k),
        Venituri: Math.round(v.venituri * 100) / 100,
        Costuri:  Math.round(v.costuri  * 100) / 100,
        Profit:   Math.round(v.profit   * 100) / 100,
        Marjă:    v.venituri > 0 ? Math.round((v.profit / v.venituri) * 1000) / 10 : 0,
      }))
  }, [completedCases])

  // ── Cases by work type ────────────────────────────────────────────────
  const byWorkType = useMemo(() => {
    const map = new Map<string, { n: number; revenue: number; profit: number }>()
    for (const c of completedCases as CaseRow[]) {
      const e = map.get(c.work_type) ?? { n: 0, revenue: 0, profit: 0 }
      e.n++
      e.revenue += Number(c.final_price)
      e.profit  += Number(c.estimated_profit)
      map.set(c.work_type, e)
    }
    return [...map.entries()]
      .sort((a,b) => b[1].revenue - a[1].revenue)
      .map(([wt, v]) => ({
        tip:     workLabel(wt),
        Cazuri:  v.n,
        Venituri:Math.round(v.revenue * 100) / 100,
        Profit:  Math.round(v.profit  * 100) / 100,
        Marjă:   v.revenue > 0 ? Math.round((v.profit / v.revenue) * 1000) / 10 : 0,
      }))
  }, [completedCases])

  // ── Top materials by usage quantity ──────────────────────────────────
  const topByQty = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; qty: number; cost: number }>()
    for (const u of filteredUsage) {
      if (!u.materials) continue
      const id = u.materials.id
      const e  = map.get(id) ?? { name: u.materials.name, unit: u.materials.unit, qty: 0, cost: 0 }
      e.qty  += Number(u.quantity_used)
      e.cost += Number(u.total_cost)
      map.set(id, e)
    }
    return [...map.values()]
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 10)
      .map(e => ({
        material:    e.name.length > 22 ? e.name.slice(0,20)+'…' : e.name,
        fullName:    e.name,
        Cantitate:   Math.round(e.qty * 100) / 100,
        unit:        e.unit,
        'Cost total': Math.round(e.cost * 100) / 100,
      }))
  }, [filteredUsage])

  // ── Top materials by total cost ───────────────────────────────────────
  const topByCost = useMemo(() => [...topByQty]
    .sort((a,b) => b['Cost total'] - a['Cost total'])
    .slice(0, 10),
    [topByQty]
  )

  // ── Inventory top 10 by value ─────────────────────────────────────────
  const stockTop = useMemo(() =>
    [...stock]
      .map(m => ({
        material:  m.name.length > 22 ? m.name.slice(0,20)+'…' : m.name,
        fullName:  m.name,
        'Valoare': Math.round(Number(m.quantity) * Number(m.cost_per_unit) * 100) / 100,
        Cantitate: Number(m.quantity),
        unit:      m.unit,
      }))
      .sort((a,b) => b['Valoare'] - a['Valoare'])
      .slice(0, 10),
    [stock]
  )

  // ── Pie chart: cases by work type ─────────────────────────────────────
  const pieData = useMemo(() =>
    byWorkType.slice(0,8).map((d,i) => ({ name: d.tip, value: d.Cazuri, fill: PAL[i % PAL.length] })),
    [byWorkType]
  )

  const noData = completedCases.length === 0

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapoarte</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Metrici de rentabilitate, consum materiale și valoare stoc
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-1.5 flex-wrap bg-muted/50 p-1 rounded-xl border">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${range === r
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'}`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Venituri', value: formatCurrency(totals.rev), note: `${totals.n} cazuri`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Cost Total', value: formatCurrency(totals.cost), note: 'mat + muncă + utilaje', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Profit Brut', value: formatCurrency(totals.profit), note: formatPercent(totals.margin) + ' marjă', icon: TrendingUp, color: totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: totals.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Cost Materiale', value: formatCurrency(totals.mat), note: 'din cazuri', icon: Package2, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Cazuri Deschise', value: totals.open, note: 'în curs', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Valoare Stoc', value: formatCurrency(totals.stockVal), note: 'la prețul de achiziție', icon: Package2, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(({ label, value, note, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
              </div>
              <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {noData ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/40">
              <BarChart3 className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-medium">Nicio dată disponibilă pentru perioada selectată</p>
            <p className="text-xs">Selectați o perioadă mai lungă sau adăugați cazuri finalizate.</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Monthly revenue vs cost ─────────────────────────────── */}
          {monthlyTrend.length > 0 && (
            <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20">
                <h2 className="font-semibold text-sm">Venituri vs. Costuri Lunare</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cazuri finalizate și livrate</p>
              </div>
              <div className="px-5 py-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 4, left: 8 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="luna" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => formatCurrency(v).replace(/\.00$/, '')} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<MoneyTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Venituri" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar dataKey="Costuri"  fill="#f97316" radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar dataKey="Profit"   fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* ── Profit margin trend + pie by work type ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profit margin line chart */}
            {monthlyTrend.length > 1 && (
              <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20">
                  <h2 className="font-semibold text-sm">Evoluția Marjei de Profit</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Profit / Venituri × 100</p>
                </div>
                <div className="px-5 py-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="luna" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip content={<PctTooltip />} />
                      <Line type="monotone" dataKey="Marjă" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Cases by work type — pie */}
            {pieData.length > 0 && (
              <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20">
                  <h2 className="font-semibold text-sm">Distribuție pe Tip de Lucrare</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Cazuri finalizate</p>
                </div>
                <div className="px-5 py-5 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {pieData.map((_e: { name: string; value: number; fill: string }, i: number) => <Cell key={i} fill={_e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [`${v} cazuri`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </div>

          {/* ── Profit by work type — bar ───────────────────────────── */}
          {byWorkType.length > 0 && (
            <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20">
                <h2 className="font-semibold text-sm">Profit pe Tip de Lucrare</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Venituri, profit și marjă</p>
              </div>
              <div className="px-5 py-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
                        {['Tip Lucrare','Cazuri','Venituri','Profit','Marjă'].map(h =>
                          <th key={h} className="text-left pb-2 px-2 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {byWorkType.map((row: typeof byWorkType[0], i: number) => (
                        <tr key={row.tip} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2.5 px-2 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PAL[i % PAL.length] }} />
                              {row.tip}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 tabular-nums text-muted-foreground">{row.Cazuri}</td>
                          <td className="py-2.5 px-2 tabular-nums">{formatCurrency(row.Venituri)}</td>
                          <td className={`py-2.5 px-2 tabular-nums font-semibold ${row.Profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(row.Profit)}</td>
                          <td className="py-2.5 px-2 tabular-nums text-muted-foreground">{formatPercent(row.Marjă)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── Material usage charts ───────────────────────────────── */}
          {topByQty.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top by quantity consumed */}
              <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20">
                  <h2 className="font-semibold text-sm">Materiale Cel Mai Utilizate</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">După cantitate consumată</p>
                </div>
                <div className="px-5 py-5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topByQty} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="material" type="category" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
                            <p className="font-semibold">{d.fullName}</p>
                            <p>Cantitate: {d.Cantitate} {d.unit}</p>
                            <p>Cost total: {formatCurrency(d['Cost total'])}</p>
                          </div>
                        )
                      }} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                      <Bar dataKey="Cantitate" radius={[0,4,4,0]} maxBarSize={18}>
                        {topByQty.map((_: unknown, i: number) => <Cell key={i} fill={PAL[i % PAL.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Top by cost */}
              <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-muted/20">
                  <h2 className="font-semibold text-sm">Materiale Cel Mai Costisitoare</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">După costul total de utilizare</p>
                </div>
                <div className="px-5 py-5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topByCost} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v).replace(/\.00$/,'')} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="material" type="category" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
                            <p className="font-semibold">{d.fullName}</p>
                            <p>Cost total: {formatCurrency(d['Cost total'])}</p>
                            <p>Cantitate: {d.Cantitate} {d.unit}</p>
                          </div>
                        )
                      }} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                      <Bar dataKey="Cost total" radius={[0,4,4,0]} maxBarSize={18}>
                        {topByCost.map((_: unknown, i: number) => <Cell key={i} fill={PAL[(i+3) % PAL.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* ── Current inventory value ─────────────────────────────── */}
          {stockTop.length > 0 && (
            <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/20">
                <h2 className="font-semibold text-sm">Valoare Stoc Curent — Top 10</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cantitate × cost de achiziție</p>
              </div>
              <div className="px-5 py-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stockTop} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v).replace(/\.00$/,'')} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="material" type="category" width={130} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold">{d.fullName}</p>
                          <p>Valoare: {formatCurrency(d['Valoare'])}</p>
                          <p>Cantitate: {d.Cantitate} {d.unit}</p>
                        </div>
                      )
                    }} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
                    <Bar dataKey="Valoare" radius={[0,4,4,0]} maxBarSize={18}>
                      {stockTop.map((_: unknown, i: number) => <Cell key={i} fill={PAL[(i+5) % PAL.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
