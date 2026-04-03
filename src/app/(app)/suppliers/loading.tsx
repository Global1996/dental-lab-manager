// src/app/(app)/suppliers/loading.tsx
// Skeleton shown while the server fetches suppliers data.

export default function SuppliersLoading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
        <div className="h-9 w-40 rounded-lg bg-muted" />
      </div>

      {/* Search bar */}
      <div className="h-9 w-72 rounded-lg bg-muted" />

      {/* Count line */}
      <div className="h-3 w-28 rounded bg-muted" />

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b bg-muted/40">
          {[140, 120, 160, 100, 80, 160, 60].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w}px`, maxWidth: '100%' }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 px-4 py-3.5 border-b last:border-0 items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="flex gap-1">
              <div className="h-7 w-7 rounded bg-muted" />
              <div className="h-7 w-7 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
