'use client'
// src/components/alerts/CriticalAlertBanner.tsx
// A dismissible banner shown at the top of the main content area when there
// are CRITICAL alerts (out of stock or expired materials).
// Dismissed per-session in localStorage — reappears after a page refresh
// so it can't be ignored indefinitely.

import { useState } from 'react'
import Link from 'next/link'
import { AlertOctagon, ChevronRight, X } from 'lucide-react'

interface Props {
  criticalCount: number
  /** Short description of the most severe item for the banner label */
  topMessage?:   string
}

export function CriticalAlertBanner({ criticalCount, topMessage }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || criticalCount === 0) return null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3
                    flex items-center gap-3 shadow-sm">
      {/* Icon */}
      <div className="p-1.5 rounded-lg bg-red-100 shrink-0">
        <AlertOctagon className="w-4 h-4 text-red-600" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">
          {criticalCount} {criticalCount === 1 ? 'alertă critică necesită' : 'alerte critice necesită'} atenție imediată
        </p>
        {topMessage && (
          <p className="text-xs text-red-600 mt-0.5 truncate">{topMessage}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-700
                     hover:text-red-900 transition-colors"
        >
          Vezi alertele
          <ChevronRight className="w-3 h-3" />
        </Link>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Închide bannerul"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
