'use client'
// src/components/ui/ExportButton.tsx
// Dropdown button that triggers CSV or Excel export.
// Accepts already-shaped rows so the caller controls what gets exported.
//
// Usage:
//   <ExportButton
//     filename="materiale-2024-01"
//     rows={filtered.map(m => ({ Nume: m.name, SKU: m.sku ?? '' }))}
//     disabled={filtered.length === 0}
//   />

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { exportToCsv, exportToXlsx, type ExportRow } from '@/lib/export'
import { cn } from '@/lib/utils'

interface Props {
  filename:  string        // base filename without extension
  rows:      ExportRow[]   // already-filtered, already-shaped data
  disabled?: boolean
  className?: string
}

export function ExportButton({ filename, rows, disabled = false, className }: Props) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleCsv() {
    setLoading('csv')
    setOpen(false)
    try {
      exportToCsv(filename, rows)
    } finally {
      setLoading(null)
    }
  }

  async function handleXlsx() {
    setLoading('xlsx')
    setOpen(false)
    try {
      await exportToXlsx(filename, rows)
    } finally {
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>

      {/* Main trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
          'transition-colors bg-background hover:bg-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'bg-accent',
        )}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Download  className="w-3.5 h-3.5" />}
        <span>Exportă</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-30 min-w-[170px]',
            'rounded-xl border bg-background shadow-lg overflow-hidden',
          )}
          role="menu"
        >
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Format export
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} {rows.length === 1 ? 'înregistrare' : 'înregistrări'}
            </p>
          </div>

          <div className="py-1">
            {/* CSV */}
            <button
              onClick={handleCsv}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm
                         hover:bg-accent transition-colors text-left"
            >
              <div className="p-1.5 rounded bg-green-100 shrink-0">
                <FileText className="w-3.5 h-3.5 text-green-700" />
              </div>
              <div>
                <p className="font-medium">CSV</p>
                <p className="text-xs text-muted-foreground">
                  Excel, Google Sheets, Numbers
                </p>
              </div>
            </button>

            {/* Excel */}
            <button
              onClick={handleXlsx}
              role="menuitem"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm
                         hover:bg-accent transition-colors text-left"
            >
              <div className="p-1.5 rounded bg-blue-100 shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium">Excel (.xlsx)</p>
                <p className="text-xs text-muted-foreground">
                  Microsoft Excel, LibreOffice
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
