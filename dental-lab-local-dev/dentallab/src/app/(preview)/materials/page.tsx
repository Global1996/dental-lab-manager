// src/app/(preview)/materials/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Package2, AlertTriangle, XCircle, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Materials' }

const MATERIALS = [
  { id: '1', name: 'IPS e.max CAD A2 LT',   sku: 'IPS-EMAXCAD-A2LT', category: 'Ceramic',    unit: 'piece',   qty: 4,   threshold: 5,  cost: 8.40,  expiry: null,         status: 'low'  },
  { id: '2', name: 'Vita Zirconia HT',       sku: 'VITA-ZIRC-HT',     category: 'Zirconia',   unit: 'g',       qty: 850, threshold: 200, cost: 0.60,  expiry: '2025-09-15', status: 'ok'   },
  { id: '3', name: 'Impression Alginate',    sku: 'IMP-ALG-500',      category: 'Impression', unit: 'pack',    qty: 0,   threshold: 5,  cost: 4.20,  expiry: '2025-06-30', status: 'out'  },
  { id: '4', name: 'Temporary Composite A2', sku: 'TMP-COMP-A2',      category: 'Composite',  unit: 'syringe', qty: 6,   threshold: 2,  cost: 14.90, expiry: '2024-12-28', status: 'ok'   },
  { id: '5', name: 'Zirconia Disc 98mm',     sku: 'ZIRC-DISC-98',     category: 'Zirconia',   unit: 'piece',   qty: 12,  threshold: 4,  cost: 28.50, expiry: null,         status: 'ok'   },
  { id: '6', name: 'Resin Cement A2',        sku: 'RES-CEM-A2',       category: 'Cements',    unit: 'syringe', qty: 3,   threshold: 2,  cost: 19.80, expiry: '2025-01-18', status: 'ok'   },
  { id: '7', name: 'Impression Putty Base',  sku: 'IMP-PUTTY-BASE',   category: 'Impression', unit: 'ml',      qty: 400, threshold: 100, cost: 0.45, expiry: '2025-11-01', status: 'ok'   },
  { id: '8', name: 'Metal Bond Ceramic',     sku: 'MET-BOND-CER',     category: 'Ceramic',    unit: 'g',       qty: 55,  threshold: 20, cost: 1.50,  expiry: null,         status: 'ok'   },
]

const STATUS_BADGE: Record<string, { label: string; cls: string; Icon?: React.ElementType }> = {
  ok:  { label: 'In Stock',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low: { label: 'Low Stock',    cls: 'bg-amber-50   text-amber-700   border-amber-200',   Icon: AlertTriangle },
  out: { label: 'Out of Stock', cls: 'bg-red-50     text-red-700     border-red-200',     Icon: XCircle },
}

export default function PreviewMaterialsPage() {
  const totalValue = MATERIALS.reduce((s, m) => s + m.qty * m.cost, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {MATERIALS.length} active materials · inventory value {formatCurrency(totalValue)}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                           text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Material
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Material', 'SKU', 'Category', 'Unit', 'Cost/Unit', 'In Stock', 'Status', 'Expiry', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATERIALS.map(m => {
                const badge = STATUS_BADGE[m.status]
                const BadgeIcon = badge.Icon
                return (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 shrink-0">
                          <Package2 className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.sku}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(m.cost)}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{m.qty} {m.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${badge.cls}`}>
                        {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {m.expiry ? formatDate(m.expiry) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors text-xs">Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
