// src/app/(preview)/alerts/page.tsx
import type { Metadata } from 'next'
import { AlertsPanel }      from '@/components/alerts/AlertsPanel'
import { AlertsSummaryBar } from '@/components/alerts/AlertsSummaryBar'
import { Bell } from 'lucide-react'
import type { Alert, AlertSummary } from '@/lib/alerts/types'

export const metadata: Metadata = { title: 'Alerts' }

const ALERTS: Alert[] = [
  { id: 'stock-1', kind: 'out_of_stock', severity: 'critical', title: 'Out of Stock',
    message: 'Impression Alginate has zero units remaining. Reorder threshold is 5 pack.',
    material: { id: 'm1', name: 'Impression Alginate', sku: 'IMP-ALG-500', unit: 'pack', quantity: 0, min_threshold: 5, expiry_date: null, location: 'Shelf A2', category_name: 'Impression' } },
  { id: 'expiry-1', kind: 'expired', severity: 'critical', title: 'Expired',
    message: 'Temporary Composite expired 3 days ago (Dec 28, 2024). Remove from inventory.',
    material: { id: 'm2', name: 'Temporary Composite', sku: 'TMP-COMP-A2', unit: 'syringe', quantity: 6, min_threshold: 2, expiry_date: '2024-12-28', location: 'Fridge F1', category_name: 'Composite' }, days_until_expiry: -3 },
  { id: 'stock-2', kind: 'low_stock', severity: 'warning', title: 'Low Stock',
    message: 'IPS e.max CAD A2 has 4 piece remaining (80% of minimum threshold 5 piece).',
    material: { id: 'm3', name: 'IPS e.max CAD A2', sku: 'IPS-EMAXCAD-A2', unit: 'piece', quantity: 4, min_threshold: 5, expiry_date: null, location: 'Cabinet C1', category_name: 'Ceramic' }, stock_percent: 80 },
  { id: 'expiry-2', kind: 'expiring_soon', severity: 'warning', title: 'Expiring Soon',
    message: 'Resin Cement A2 expires in 18 days (Jan 18, 2025).',
    material: { id: 'm4', name: 'Resin Cement A2', sku: 'RES-CEM-A2', unit: 'syringe', quantity: 3, min_threshold: 2, expiry_date: '2025-01-18', location: 'Shelf B3', category_name: 'Cements' }, days_until_expiry: 18 },
  { id: 'expiry-3', kind: 'expiring_later', severity: 'info', title: 'Expiry Notice',
    message: 'Vita Zirconia HT expires in 45 days (Feb 14, 2025).',
    material: { id: 'm5', name: 'Vita Zirconia HT', sku: 'VITA-ZIRC-HT', unit: 'g', quantity: 850, min_threshold: 200, expiry_date: '2025-02-14', location: 'Cabinet C2', category_name: 'Zirconia' }, days_until_expiry: 45 },
]

const SUMMARY: AlertSummary = { total: 5, critical: 2, warning: 2, info: 1 }

export default function PreviewAlertsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-primary/10"><Bell className="w-4 h-4 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground text-sm">Low stock, expired, and expiring materials</p>
        </div>
      </div>
      <AlertsSummaryBar summary={SUMMARY} />
      <AlertsPanel alerts={ALERTS} variant="full" />
    </div>
  )
}
