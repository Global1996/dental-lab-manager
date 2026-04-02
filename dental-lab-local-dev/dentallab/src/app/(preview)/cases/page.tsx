// src/app/(preview)/cases/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { STATUS_STYLES, CASE_STATUS_OPTIONS } from '@/components/cases/caseSchema'
import { Plus, ChevronRight, Briefcase } from 'lucide-react'
import type { Case } from '@/types'

export const metadata: Metadata = { title: 'Cases' }

const CASES = [
  { id: 'c1', case_code: 'CASE-2025-0014', patient_name: 'Maria Ionescu',     clinic_name: 'Smile Dental',      doctor_name: 'Dr. Popescu',  work_type: 'crown',          status: 'in_progress',       received_date: '2025-01-05', due_date: '2025-01-12', material_cost: 42.30,  labor_cost: 120, machine_cost: 25, total_cost: 187.30, final_price: 320, estimated_profit: 132.70, profit_margin_pct: 41.5 },
  { id: 'c2', case_code: 'CASE-2025-0013', patient_name: 'Ion Vasile',         clinic_name: 'Oradea Dent',       doctor_name: 'Dr. Mihai',    work_type: 'bridge',         status: 'awaiting_approval', received_date: '2025-01-03', due_date: '2025-01-10', material_cost: 128.50, labor_cost: 280, machine_cost: 60, total_cost: 468.50, final_price: 750, estimated_profit: 281.50, profit_margin_pct: 37.5 },
  { id: 'c3', case_code: 'CASE-2025-0012', patient_name: 'Elena Dumitrescu',   clinic_name: 'Cluj Pro Dental',   doctor_name: 'Dr. Stancu',   work_type: 'veneer',         status: 'completed',         received_date: '2024-12-28', due_date: '2025-01-04', material_cost: 89.10,  labor_cost: 200, machine_cost: 40, total_cost: 329.10, final_price: 550, estimated_profit: 220.90, profit_margin_pct: 40.2 },
  { id: 'c4', case_code: 'CASE-2025-0011', patient_name: 'Andrei Popa',        clinic_name: 'Timis Dental',      doctor_name: 'Dr. Radu',     work_type: 'denture_full',   status: 'draft',             received_date: '2025-01-06', due_date: null,         material_cost: 0,      labor_cost: 0,   machine_cost: 0,  total_cost: 0,      final_price: 0,   estimated_profit: 0,      profit_margin_pct: 0    },
  { id: 'c5', case_code: 'CASE-2025-0010', patient_name: 'Cristina Marian',    clinic_name: 'Smile Dental',      doctor_name: 'Dr. Popescu',  work_type: 'implant',        status: 'delivered',         received_date: '2024-12-20', due_date: '2024-12-30', material_cost: 185.00, labor_cost: 350, machine_cost: 80, total_cost: 615.00, final_price: 950, estimated_profit: 335.00, profit_margin_pct: 35.3 },
]

export default function PreviewCasesPage() {
  const open      = CASES.filter(c => ['draft','in_progress','awaiting_approval'].includes(c.status)).length
  const completed = CASES.filter(c => ['completed','delivered'].includes(c.status)).length
  const revenue   = CASES.filter(c => ['completed','delivered'].includes(c.status)).reduce((s,c) => s + c.final_price, 0)
  const profit    = CASES.filter(c => ['completed','delivered'].includes(c.status)).reduce((s,c) => s + c.estimated_profit, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">{CASES.length} total cases</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2
                           text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Cases',           value: open,                           color: 'text-blue-600'    },
          { label: 'Completed / Delivered',value: completed,                      color: 'text-emerald-600' },
          { label: 'Total Revenue',        value: formatCurrency(revenue),        color: 'text-foreground'  },
          { label: 'Total Profit',         value: formatCurrency(profit),         color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {['Case', 'Patient', 'Type', 'Status', 'Due', 'Total Cost', 'Price', 'Profit', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CASES.map(c => {
                const style = STATUS_STYLES[c.status as keyof typeof STATUS_STYLES]
                const label = CASE_STATUS_OPTIONS.find(o => o.value === c.status)?.label ?? c.status
                const profit = c.estimated_profit
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{c.case_code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{c.doctor_name}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize text-xs">{c.work_type.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${style.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.due_date ? formatDate(c.due_date) : '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-xs">{c.total_cost > 0 ? formatCurrency(c.total_cost) : '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-xs">{c.final_price > 0 ? formatCurrency(c.final_price) : '—'}</td>
                    <td className={`px-4 py-3 tabular-nums font-semibold text-xs ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {c.total_cost > 0 ? formatCurrency(profit) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/preview/cases/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        View <ChevronRight className="w-3 h-3" />
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
