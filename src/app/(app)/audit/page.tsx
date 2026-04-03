// src/app/(app)/audit/page.tsx
// Audit Log page — shows who changed what and when.
// Server Component: fetches the last 200 entries with user profile joins.
// No client state needed — the table is read-only.

import type { Metadata }            from 'next'
import { getServerSupabaseClient }  from '@/lib/supabase/server'
import {
  Package2, Briefcase, ArrowLeftRight,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditLog, AuditAction, AuditEntityType } from '@/types'

export const metadata: Metadata = { title: 'Jurnal de activitate' }

// ─── Display config ───────────────────────────────────────────────────────────

const ACTION_LABEL: Record<AuditAction, string> = {
  create:     'Creat',
  update:     'Actualizat',
  delete:     'Dezactivat',
  stock_in:   'Intrare stoc',
  stock_out:  'Ieșire stoc',
  adjustment: 'Ajustare stoc',
}

const ACTION_STYLE: Record<AuditAction, string> = {
  create:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  update:     'bg-blue-50    text-blue-700    border-blue-200',
  delete:     'bg-red-50     text-red-700     border-red-200',
  stock_in:   'bg-teal-50    text-teal-700    border-teal-200',
  stock_out:  'bg-orange-50  text-orange-700  border-orange-200',
  adjustment: 'bg-violet-50  text-violet-700  border-violet-200',
}

const ENTITY_LABEL: Record<AuditEntityType, string> = {
  material:       'Material',
  case:           'Caz',
  stock_movement: 'Mișcare stoc',
}

const ENTITY_ICON: Record<AuditEntityType, React.ElementType> = {
  material:       Package2,
  case:           Briefcase,
  stock_movement: ArrowLeftRight,
}

// ─── Date formatting ──────────────────────────────────────────────────────────

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditPage() {
  const sb = getServerSupabaseClient()

  const { data: logsRaw, count } = await sb
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(200)

  const logs = (logsRaw ?? []) as AuditLog[]

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jurnal de activitate</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ultimele {logs.length} înregistrări din {count ?? 0} total
        </p>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/40">
              <Clock className="w-7 h-7 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium">Nicio activitate înregistrată</p>
              <p className="text-xs mt-1">
                Jurnalul se completează automat când se creează, editează sau șterge un element.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {['Data și ora', 'Utilizator', 'Acțiune', 'Tip', 'Element', 'Detalii'].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                                 text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const { date, time } = formatDateTime(log.created_at)
                  const actionLabel    = ACTION_LABEL[log.action]    ?? log.action
                  const actionStyle    = ACTION_STYLE[log.action]    ?? 'bg-muted text-muted-foreground border-border'
                  const entityLabel    = ENTITY_LABEL[log.entity_type] ?? log.entity_type
                  const EntityIcon     = ENTITY_ICON[log.entity_type]  ?? Package2

                  return (
                    <tr
                      key={log.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      {/* Date + time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium">{date}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 max-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center
                                          justify-center text-primary text-xs font-bold shrink-0">
                            {log.user_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate text-xs font-medium">{log.user_name}</span>
                        </div>
                      </td>

                      {/* Action badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                          actionStyle,
                        )}>
                          {actionLabel}
                        </span>
                      </td>

                      {/* Entity type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <EntityIcon className="w-3.5 h-3.5 shrink-0" />
                          {entityLabel}
                        </span>
                      </td>

                      {/* Entity label (name snapshot) */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <span className="block truncate text-xs font-medium font-mono">
                          {log.entity_label ?? '—'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 max-w-[260px]">
                        <span
                          className="block text-xs text-muted-foreground"
                          title={log.details ?? ''}
                          style={{
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          } as React.CSSProperties}
                        >
                          {log.details ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          {(count ?? 0) > 200 && (
            <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
              Afișate ultimele 200 din {count} înregistrări.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
