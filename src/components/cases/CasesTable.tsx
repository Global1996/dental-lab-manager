'use client'
// src/components/cases/CasesTable.tsx
// Client component — owns search + status filter state.
// Renders the cases list with links to the detail page.

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Briefcase, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { formatCurrency, formatDate } from '@/lib/utils'
import { STATUS_STYLES, CASE_STATUS_OPTIONS, WORK_TYPE_OPTIONS } from './caseSchema'
import type { Case, CaseStatus } from '@/types'
import { ExportButton } from '@/components/ui/ExportButton'
import type { ExportRow } from '@/lib/export'

interface Props { cases: Case[] }

// Shape case rows for export — human-readable Romanian headers
function shapeCaseRows(cases: Case[]): ExportRow[] {
  const statusLabel: Record<string, string> = {
    draft: 'Schiță', in_progress: 'În Desfășurare',
    awaiting_approval: 'În Așteptarea Aprobării',
    completed: 'Finalizat', delivered: 'Livrat', cancelled: 'Anulat',
  }
  const workLabel: Record<string, string> = {
    crown: 'Coroană', bridge: 'Punte', veneer: 'Fațetă',
    implant: 'Implant', denture_full: 'Proteză Totală',
    denture_partial: 'Proteză Parțială', orthodontic: 'Ortodontic',
    inlay_onlay: 'Inlay / Onlay', night_guard: 'Gutieră Nocturnă', other: 'Altele',
  }
  return cases.map(c => ({
    'Cod Caz':        c.case_code,
    'Pacient':        c.patient_name,
    'Clinică':        c.clinic_name ?? '',
    'Doctor':         c.doctor_name ?? '',
    'Tip Lucrare':    workLabel[c.work_type] ?? c.work_type,
    'Status':         statusLabel[c.status] ?? c.status,
    'Data Primirii':  c.received_date,
    'Termen':         c.due_date ?? '',
    'Data Finalizării': c.completed_date ?? '',
    'Cost Materiale': Number(c.material_cost),
    'Manoperă':       Number(c.labor_cost),
    'Utilaje':        Number(c.machine_cost),
    'Cost Total':     Number(c.total_cost),
    'Preț Final':     Number(c.final_price),
    'Profit Estimat': Number(c.estimated_profit),
    'Marjă (%)':      Number(c.profit_margin_pct),
    'Note':           c.notes ?? '',
  }))
}

export function CasesTable({ cases }: Props) {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cases.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchSearch = !q ||
        c.patient_name.toLowerCase().includes(q)  ||
        c.case_code.toLowerCase().includes(q)      ||
        (c.clinic_name ?? '').toLowerCase().includes(q) ||
        (c.doctor_name ?? '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [cases, search, statusFilter])

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Caută pacient, cod caz, clinică…"
          className="flex-1 min-w-[220px] max-w-sm"
        />

        {/* Status chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...CASE_STATUS_OPTIONS.map(o => o.value)] as const).map(s => {
            const active  = statusFilter === s
            const style   = s !== 'all' ? STATUS_STYLES[s as CaseStatus] : null
            return (
              <button key={s} onClick={() => setStatusFilter(s as CaseStatus | 'all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                             font-medium border transition-colors
                             ${active
                               ? 'border-primary bg-primary/10 text-primary'
                               : 'border-border hover:bg-accent text-muted-foreground'}`}>
                {style && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
                {s === 'all' ? 'Toate statusurile' : CASE_STATUS_OPTIONS.find(o => o.value === s)?.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Count + export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {filtered.length === cases.length
            ? `${cases.length} caz${cases.length !== 1 ? 'uri' : ''}`
            : `${filtered.length} din ${cases.length} cazuri`}
        </p>
        <ExportButton
          filename={`cazuri-${new Date().toISOString().slice(0, 10)}`}
          rows={shapeCaseRows(filtered)}
          disabled={filtered.length === 0}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Caz', 'Pacient', 'Tip Lucrare', 'Status', 'Termen',
                  'Material', 'Manoperă', 'Utilaje', 'Total', 'Preț', 'Profit', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold
                                         text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-medium">
                        {search || statusFilter !== 'all'
                          ? 'Niciun caz nu corespunde filtrelor'
                          : 'Niciun caz înregistrat — creați primul'}
                      </p>
                      {(search || statusFilter !== 'all') && (
                        <button onClick={() => { setSearch(''); setStatusFilter('all') }}
                          className="text-xs text-primary hover:underline">
                          Șterge filtrele
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const style = STATUS_STYLES[c.status]
                const profit = Number(c.estimated_profit)
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">

                    {/* Case code */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {c.case_code}
                      </span>
                    </td>

                    {/* Patient info */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-medium truncate">{c.patient_name}</p>
                      {(c.clinic_name || c.doctor_name) && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.doctor_name ?? c.clinic_name}
                        </p>
                      )}
                    </td>

                    {/* Work type */}
                    <td className="px-4 py-3 capitalize text-muted-foreground whitespace-nowrap">
                      {WORK_TYPE_OPTIONS.find(o => o.value === c.work_type)?.label ?? c.work_type}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5
                                        rounded border text-xs font-medium ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {CASE_STATUS_OPTIONS.find(o => o.value === c.status)?.label}
                      </span>
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDate(c.due_date)}
                    </td>

                    {/* Cost columns */}
                    <td className="px-4 py-3 tabular-nums text-muted-foreground text-xs">
                      {formatCurrency(Number(c.material_cost))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground text-xs">
                      {formatCurrency(Number(c.labor_cost))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground text-xs">
                      {formatCurrency(Number(c.machine_cost))}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium text-xs">
                      {formatCurrency(Number(c.total_cost))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-xs">
                      {formatCurrency(Number(c.final_price))}
                    </td>

                    {/* Profit */}
                    <td className={`px-4 py-3 tabular-nums font-semibold text-xs
                      ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </td>

                    {/* Detail link */}
                    <td className="px-4 py-3">
                      <Link href={`/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground
                                   hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        Deschide
                        <ChevronRight className="w-3 h-3" />
                      </Link>
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
