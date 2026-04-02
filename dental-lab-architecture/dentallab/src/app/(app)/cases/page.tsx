// src/app/(app)/cases/page.tsx
// Cases — patient work orders with status, costs, and profit.
// Full case creation form, material assignment, and cost calculator in Phase 2.

import type { Metadata } from 'next'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, CASE_STATUS_LABELS, caseStatusVariant } from '@/lib/utils'
import type { CaseStatus } from '@/types'

export const metadata: Metadata = { title: 'Cases' }

export default async function CasesPage() {
  const sb = getServerSupabaseClient()
  const { data: cases, count } = await sb
    .from('cases')
    .select('*, patients(full_name, patient_code)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(30)

  const variantClass: Record<string, string> = {
    outline:     'bg-muted text-muted-foreground',
    secondary:   'bg-blue-50 text-blue-700',
    default:     'bg-emerald-50 text-emerald-700',
    destructive: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} total cases
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-60 cursor-not-allowed"
          title="Available in Phase 2"
        >
          New Case
        </button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Case #', 'Patient', 'Type', 'Status', 'Due', 'Material Cost', 'Total Cost', 'Price', 'Profit'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(cases ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    No cases yet. Create your first case in Phase 2.
                  </td>
                </tr>
              ) : (
                (cases ?? []).map((c: any) => {
                  const variant = caseStatusVariant(c.status as CaseStatus)
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{c.case_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.patients?.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{c.patients?.patient_code}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{c.case_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClass[variant]}`}>
                          {CASE_STATUS_LABELS[c.status as CaseStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(c.due_date)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatCurrency(c.material_cost)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(c.total_cost)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCurrency(c.final_price)}</td>
                      <td className={`px-4 py-3 tabular-nums font-semibold ${c.estimated_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(c.estimated_profit)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Case creation, material assignment, and cost calculator — Phase 2
      </p>
    </div>
  )
}
