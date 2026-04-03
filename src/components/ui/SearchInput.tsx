'use client'
// src/components/ui/SearchInput.tsx
// Reusable search input with a leading icon and clear button.
//
// WHY THIS FILE EXISTS:
//   MaterialsTable.tsx, CasesTable.tsx, MovementsTable.tsx, and
//   AddMaterialUsageDialog.tsx all had identical search bar markup.
//   This component replaces all four.

import { Search, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value:       string
  onChange:    (value: string) => void
  placeholder?: string
  className?:  string
}

export function SearchInput({ value, onChange, placeholder = 'Caută…', className }: Props) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                   text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm
                   placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2
                     text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Șterge căutarea"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
