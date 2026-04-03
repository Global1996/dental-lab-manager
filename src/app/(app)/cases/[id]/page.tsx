// src/app/(app)/cases/[id]/page.tsx
// Case detail page — Server Component.
// Shows case info, financial summary, and the materials used table.
// Fetches the case + materials in parallel.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { EditCaseDialog }           from '@/components/cases/EditCaseDialog'
import { CostCalculatorPanel }      from '@/components/calculator/CostCalculatorPanel'
import { MaterialUsageTable }       from '@/components/cases/MaterialUsageTable'
import { AddMaterialUsageDialog }   from '@/components/cases/AddMaterialUsageDialog'
import { formatDate, formatRelative } from '@/lib/utils'
import { STATUS_STYLES, CASE_STATUS_OPTIONS, WORK_TYPE_OPTIONS } from '@/components/cases/caseSchema'
import { ChevronLeft, CalendarDays, User, Building2, Stethoscope } from 'lucide-react'
import type { Case, CaseMaterialUsage, MaterialWithJoins, CaseStatus } from '@/types'

export const metadata: Metadata = { title: 'Detalii Caz' }

interface Props { params: { id: string } }

export default async function CaseDetailPage({ params }: Props) {
  const sb = getServerSupabaseClient()

  const [
    { data: caseRaw },
    { data: usagesRaw },
    { data: materialsRaw },
  ] = await Promise.all([
    sb.from('cases').select('*').eq('id', params.id).single(),
    sb.from('case_material_usage')
      .select('*, materials(id, name, unit, sku)')
      .eq('case_id', params.id)
      .order('created_at', { ascending: false }),
    sb.from('materials')
      .select('*, categories(id,name,color), suppliers(id,name)')  // quantity is a direct column, already included via *
      .eq('is_active', true)
      .order('name'),
  ])

  if (!caseRaw) notFound()

  const c        = caseRaw as Case
  const usages   = (usagesRaw  ?? []) as CaseMaterialUsage[]
  const materials = (materialsRaw ?? []) as MaterialWithJoins[]

  const style     = STATUS_STYLES[c.status as CaseStatus]
  const statusLabel = CASE_STATUS_OPTIONS.find(o => o.value === c.status)?.label ?? c.status
  const workLabel   = WORK_TYPE_OPTIONS.find(o => o.value === c.work_type)?.label ?? c.work_type

  // Editable only when not in a terminal status
  const editable  = !['completed', 'delivered', 'cancelled'].includes(c.status)

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/cases" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
          Cazuri
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">{c.case_code}</span>
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{c.case_code}</h1>
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                              rounded-full border text-xs font-semibold ${style.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {statusLabel}
            </span>
            {/* Work type badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full
                             border bg-muted text-muted-foreground text-xs font-medium">
              {workLabel}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5">
            Creat {formatRelative(c.created_at)}
          </p>
        </div>

        {editable && <EditCaseDialog case_={c} />}
      </div>

      {/* Two-column layout: left=details, right=financials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: case info cards */}
        <div className="lg:col-span-2 space-y-5">

          {/* Patient & clinic info */}
          <div className="rounded-xl border bg-card shadow-sm p-5">
            <h2 className="text-sm font-semibold mb-4">Informații Caz</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 shrink-0">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pacient</p>
                  <p className="text-sm font-semibold mt-0.5">{c.patient_name}</p>
                </div>
              </div>

              {c.clinic_name && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clinică</p>
                    <p className="text-sm font-semibold mt-0.5">{c.clinic_name}</p>
                  </div>
                </div>
              )}

              {c.doctor_name && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 shrink-0">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="text-sm font-semibold mt-0.5">{c.doctor_name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 shrink-0">
                  <CalendarDays className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-xs mt-0.5">
                    <span className="text-muted-foreground">Primit:</span>{' '}
                    <span className="font-medium">{formatDate(c.received_date)}</span>
                  </p>
                  {c.due_date && (
                    <p className="text-xs mt-0.5">
                      <span className="text-muted-foreground">Termen:</span>{' '}
                      <span className="font-medium">{formatDate(c.due_date)}</span>
                    </p>
                  )}
                  {c.completed_date && (
                    <p className="text-xs mt-0.5">
                      <span className="text-muted-foreground">Finalizat:</span>{' '}
                      <span className="font-medium">{formatDate(c.completed_date)}</span>
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Tooth & shade */}
            {(c.tooth_numbers || c.shade) && (
              <div className="mt-4 pt-4 border-t flex gap-6 text-sm">
                {c.tooth_numbers && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Număr Dinți</p>
                    <p className="font-mono font-medium">{c.tooth_numbers}</p>
                  </div>
                )}
                {c.shade && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nuanță</p>
                    <p className="font-mono font-medium">{c.shade}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {c.notes && (
            <div className="rounded-xl border bg-card shadow-sm p-5">
              <h2 className="text-sm font-semibold mb-2">Observații</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.notes}</p>
            </div>
          )}
        </div>

        {/* Right: cost calculator */}
        <div className="lg:col-span-1">
          <CostCalculatorPanel case_={c} usages={usages} />
        </div>
      </div>

      {/* Materials section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Materiale Utilizate</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {usages.length} {usages.length !== 1 ? 'materiale' : 'material'} atribuit{usages.length !== 1 ? 'e' : ''} acestui caz
              {!editable && ' · Cazul este blocat pentru editare'}
            </p>
          </div>
          {editable && (
            <AddMaterialUsageDialog caseId={c.id} materials={materials} />
          )}
        </div>

        <MaterialUsageTable
          caseId={c.id}
          usages={usages}
          editable={editable}
        />
      </div>

    </div>
  )
}
