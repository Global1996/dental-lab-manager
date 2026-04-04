// src/components/cases/FinancialSummary.tsx
// Read-only financial summary panel for the case detail page.
// Shows every cost component, total cost, final price, profit, and margin.
// All numbers passed as props — no fetching here.

import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Props {
  materialCost:    number
  laborCost:       number
  machineCost:     number
  totalCost:       number
  finalPrice:      number
  estimatedProfit: number
  profitMarginPct: number
}

interface RowProps {
  label:    string
  value:    number
  sub?:     boolean
  bold?:    boolean
  colored?: 'profit' | 'price'
}

function CostRow({ label, value, sub, bold, colored }: RowProps) {
  const colorClass =
    colored === 'profit'
      ? value >= 0 ? 'text-emerald-600' : 'text-red-600'
      : colored === 'price'
      ? 'text-primary'
      : ''

  return (
    <div className={`flex items-center justify-between py-2
      ${sub ? 'pl-4 text-muted-foreground' : ''}
      ${bold ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${sub ? 'text-xs' : ''}`}>{label}</span>
      <span className={`tabular-nums text-sm ${colorClass} ${bold ? 'text-base' : ''}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}

export function FinancialSummary({
  materialCost, laborCost, machineCost,
  totalCost, finalPrice, estimatedProfit, profitMarginPct,
}: Props) {
  const isProfit = estimatedProfit >= 0

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Sumar Financiar</h2>
        </div>
        {/* Profit margin pill */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                          text-xs font-semibold border
                          ${isProfit
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50    text-red-700    border-red-200'}`}>
          {isProfit
            ? <TrendingUp   className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {formatPercent(profitMarginPct)} marjă
        </div>
      </div>

      <div className="px-5 py-3">

        {/* Cost breakdown */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          Defalcare Costuri
        </p>
        <div className="divide-y">
          <CostRow label="Materiale (auto)"      value={materialCost}  sub />
          <CostRow label="Manoperă"                value={laborCost}     sub />
          <CostRow label="Utilaje / Echipamente"   value={machineCost}   sub />
        </div>

        {/* Total cost */}
        <div className="border-t mt-1 pt-1">
          <CostRow label="Cost Total" value={totalCost} bold />
        </div>

        {/* Separator */}
        <div className="my-3 border-t border-dashed" />

        {/* Pricing */}
        <CostRow label="Preț Final" value={finalPrice} bold colored="price" />

        {/* Profit */}
        <div className={`mt-2 rounded-lg border p-3 bg-gradient-to-br
                        ${isProfit ? 'from-emerald-50 to-transparent border-emerald-100'
                                   : 'from-red-50 to-transparent border-red-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              Profit Estimat
            </span>
            <span className={`text-lg font-bold tabular-nums
              ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(estimatedProfit)}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatPercent(profitMarginPct)} din prețul final
          </p>
        </div>

      </div>
    </div>
  )
}
