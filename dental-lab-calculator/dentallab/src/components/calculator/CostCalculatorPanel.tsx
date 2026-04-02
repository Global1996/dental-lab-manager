// src/components/calculator/CostCalculatorPanel.tsx
// The main cost calculator panel rendered on the case detail page.
// This is a CLIENT component — it holds optimistic UI state so the user
// sees instant feedback as they add/remove materials and edit costs.
//
// Data flow:
//   Server fetches case + usages → passes to this component as initial state.
//   When the user adds a material via AddMaterialUsageDialog, the action
//   calls revalidatePath() which causes the Server Component to re-fetch
//   and pass fresh data back down.
//   Meanwhile, this component recalculates totals live from the current data.

'use client'

import { useMemo } from 'react'
import { formatCurrency, formatPercent } from '@/lib/utils'
import {
  calcCostSummary, calcLineCost, fmtCurrency, profitColor,
  type MaterialLine,
} from './calcUtils'
import {
  TrendingUp, TrendingDown, DollarSign, Package2,
  Calculator, ChevronRight, Minus, Equal,
} from 'lucide-react'
import type { CaseMaterialUsage, Case } from '@/types'

interface Props {
  case_:  Case
  usages: CaseMaterialUsage[]
}

// ─── Internal sub-components ─────────────────────────────────────────────────

function SummaryRow({
  label, value, sub = false, bold = false, highlight = false, separator = false
}: {
  label:      string
  value:      number
  sub?:       boolean
  bold?:      boolean
  highlight?: 'profit' | 'price' | 'cost'
  separator?: boolean
}) {
  const valClass =
    highlight === 'profit'
      ? value >= 0 ? 'text-emerald-600' : 'text-red-600'
      : highlight === 'price'
      ? 'text-primary'
      : highlight === 'cost'
      ? 'text-foreground'
      : 'text-muted-foreground'

  return (
    <>
      {separator && <div className="my-2 border-t border-dashed" />}
      <div className={`flex items-baseline justify-between py-1.5 ${sub ? 'pl-3' : ''}`}>
        <span className={`text-sm ${sub ? 'text-xs text-muted-foreground' : bold ? 'font-semibold' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <span className={`tabular-nums font-semibold ${sub ? 'text-xs' : bold ? 'text-base' : 'text-sm'} ${valClass}`}>
          {fmtCurrency(value)}
        </span>
      </div>
    </>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function CostCalculatorPanel({ case_: c, usages }: Props) {

  // Convert DB rows to MaterialLine shape for our pure calc functions
  const lines: MaterialLine[] = useMemo(() =>
    usages.map(u => ({
      material_id:       u.material_id,
      name:              u.materials?.name ?? 'Unknown',
      sku:               u.materials?.sku ?? null,
      unit:              u.materials?.unit ?? '',
      quantity_used:     Number(u.quantity_used),
      unit_cost_at_time: Number(u.unit_cost_at_time),
      available_qty:     0,   // not needed here — only used in AddDialog
      notes:             u.notes,
    })),
    [usages]
  )

  // Recalculate from actual DB values (generated columns on `cases` are authoritative,
  // but we also compute client-side so the panel shows the right numbers immediately
  // before a server round-trip resolves)
  const summary = useMemo(() =>
    calcCostSummary(
      lines,
      Number(c.labor_cost),
      Number(c.machine_cost),
      Number(c.final_price)
    ),
    [lines, c.labor_cost, c.machine_cost, c.final_price]
  )

  // Prefer DB-generated values when available (they're the source of truth)
  const material_cost    = Number(c.material_cost)    || summary.material_cost
  const total_cost       = Number(c.total_cost)       || summary.total_cost
  const final_price      = Number(c.final_price)
  const estimated_profit = Number(c.estimated_profit) || summary.estimated_profit
  const profit_margin    = Number(c.profit_margin_pct)|| summary.profit_margin

  const isProfit = estimated_profit >= 0

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-semibold text-sm">Cost Calculator</h2>
        </div>
        {/* Margin pill */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           border text-xs font-bold
                           ${isProfit
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                             : 'bg-red-50     text-red-700     border-red-200'}`}>
          {isProfit
            ? <TrendingUp   className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {formatPercent(profit_margin)} margin
        </span>
      </div>

      <div className="px-5 py-4 space-y-1">

        {/* ── Material lines ─────────────────────────────────── */}
        {lines.length > 0 ? (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Materials ({lines.length})
            </p>
            <div className="rounded-lg border divide-y text-xs bg-muted/20">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{l.name}</p>
                    <p className="text-muted-foreground">
                      {l.quantity_used} {l.unit} × {fmtCurrency(l.unit_cost_at_time)}
                    </p>
                  </div>
                  <span className="tabular-nums font-semibold shrink-0">
                    {fmtCurrency(calcLineCost(l.quantity_used, l.unit_cost_at_time))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-3 rounded-lg border border-dashed bg-muted/20 p-4 flex items-center gap-3 text-muted-foreground">
            <Package2 className="w-4 h-4 shrink-0 opacity-50" />
            <p className="text-xs">No materials added yet. Add materials above to calculate costs.</p>
          </div>
        )}

        {/* ── Cost breakdown ─────────────────────────────────── */}
        <div className="rounded-lg border bg-background p-3 space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Cost Breakdown
          </p>

          <SummaryRow label="Materials"       value={material_cost}       sub />
          <SummaryRow label="Labour"          value={Number(c.labor_cost)}  sub />
          <SummaryRow label="Machine / Equip" value={Number(c.machine_cost)} sub />

          <div className="border-t pt-2 mt-1">
            <SummaryRow label="Total Cost" value={total_cost} bold highlight="cost" />
          </div>
        </div>

        {/* ── Equation display ───────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
          <span className="font-mono">{fmtCurrency(final_price)}</span>
          <Minus className="w-3 h-3" />
          <span className="font-mono">{fmtCurrency(total_cost)}</span>
          <Equal className="w-3 h-3" />
          <span className={`font-bold font-mono ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
            {fmtCurrency(estimated_profit)}
          </span>
        </div>

        {/* ── Profit highlight box ────────────────────────────── */}
        <div className={`rounded-lg border p-4
          ${isProfit
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200     bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide
                ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                {isProfit ? 'Estimated Profit' : 'Estimated Loss'}
              </p>
              <p className={`text-xs mt-0.5
                ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                Final price · {fmtCurrency(final_price)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold tabular-nums
                ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                {fmtCurrency(Math.abs(estimated_profit))}
              </p>
              <p className={`text-xs font-semibold
                ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatPercent(profit_margin)} margin
              </p>
            </div>
          </div>

          {/* Visual bar */}
          {final_price > 0 && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-background/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all
                    ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(profit_margin), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                <span>0%</span>
                <span className="font-semibold">{formatPercent(profit_margin)}</span>
                <span>100%</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
