// src/app/(app)/purchase-orders/loading.tsx
// Skeleton shown while the server fetches purchase orders data.

export default function PurchaseOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-7 w-10 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Search + chips */}
      <div className="space-y-3">
        <div className="h-9 w-72 rounded-lg bg-muted" />
        <div className="flex gap-2">
          {[60, 55, 70, 80].map((w, i) => (
            <div key={i} className="h-7 rounded-full bg-muted" style={{ width: `${w}px` }} />
          ))}
        </div>
        <div className="h-3 w-24 rounded bg-muted" />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b bg-muted/40">
          {[20, 120, 160, 80, 90, 80, 100].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w}px`, maxWidth: '100%' }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 px-4 py-3.5 border-b last:border-0 items-center">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted font-mono" />
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

    </div>
  )
}
