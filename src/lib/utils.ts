// src/lib/utils.ts
// App-wide utility helpers.

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import type { CaseStatus, UnitType } from '@/types'

// ─── shadcn/ui class merger ───────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  return differenceInDays(new Date(date), new Date())
}

export function isExpired(date: string | null | undefined): boolean {
  const d = daysUntil(date)
  return d !== null && d < 0
}

export function isExpiringSoon(date: string | null | undefined, warningDays = 30): boolean {
  const d = daysUntil(date)
  return d !== null && d >= 0 && d <= warningDays
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export function stockStatus(qty: number, reorder: number): 'ok' | 'low' | 'out' {
  if (qty <= 0)       return 'out'
  if (qty <= reorder) return 'low'
  return 'ok'
}

// ─── Case status ──────────────────────────────────────────────────────────────

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  draft:             'Schiță',
  in_progress:       'În Desfășurare',
  awaiting_approval: 'În Așteptarea Aprobării',
  completed:         'Finalizat',
  delivered:         'Livrat',
  cancelled:         'Anulat',
}

export function caseStatusVariant(status: CaseStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<CaseStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft:             'outline',
    in_progress:       'secondary',
    awaiting_approval: 'default',
    completed:         'default',
    delivered:         'default',
    cancelled:         'destructive',
  }
  return map[status]
}

// ─── Unit labels ──────────────────────────────────────────────────────────────

export const UNIT_LABELS: Record<UnitType, string> = {
  ml: 'ml', g: 'g', kg: 'kg', mg: 'mg',
  piece: 'pc', pack: 'pk', box: 'box', tube: 'tube', syringe: 'syr',
}

// ─── Error handling ───────────────────────────────────────────────────────────

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'An unexpected error occurred'
}
