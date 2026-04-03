'use client'
// src/components/dashboard/TopMaterialsChart.tsx
// Horizontal bar chart showing the top materials by total quantity consumed
// this month (via case_material_usage). Built with Recharts.

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { Package2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface TopMaterialEntry {
  name:          string
  quantity_used: number
  total_value:   number
  unit:          string
}

interface Props {
  data: TopMaterialEntry[]
}

const PALETTE = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
]

interface CustomTooltipProps {
  active?:  boolean
  payload?: { value: number; payload: TopMaterialEntry }[]
  label?:   string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2.5 text-xs space-y-1">
      <p className="font-semibold text-foreground truncate max-w-[200px]">{d.name}</p>
      <p className="text-muted-foreground">
        Utilizat: <span className="text-foreground font-medium">{d.quantity_used} {d.unit}</span>
      </p>
      <p className="text-muted-foreground">
        Valoare: <span className="text-foreground font-medium">{formatCurrency(d.total_value)}</span>
      </p>
    </div>
  )
}

export function TopMaterialsChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
        <Package2 className="w-8 h-8 opacity-30" />
        <p className="text-sm">Niciun consum înregistrat luna aceasta</p>
      </div>
    )
  }

  // Truncate long names for the axis
  const chartData = data.map(d => ({
    ...d,
    shortName: d.name.length > 22 ? d.name.slice(0, 20) + '…' : d.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => String(v)}
        />
        <YAxis
          dataKey="shortName"
          type="category"
          width={130}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
        <Bar dataKey="quantity_used" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
