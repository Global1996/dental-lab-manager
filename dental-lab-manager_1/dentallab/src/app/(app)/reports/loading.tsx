// src/app/(app)/reports/loading.tsx
// Skeleton shown by Next.js while the server component fetches data.
// Matches the visual layout of ReportsClient so the page doesn't jump.

export default function ReportsLoading() {
  return (
    <div className="space-y-8 max-w-[1400px] animate-pulse">

      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        {/* Date range selector skeleton */}
        <div className="h-9 w-80 rounded-xl bg-muted" />
      </div>

      {/* KPI strip — 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-6 w-16 rounded bg-muted" />
                <div className="h-3 w-14 rounded bg-muted" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Main bar chart skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20 space-y-1">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-3 w-36 rounded bg-muted" />
        </div>
        <div className="px-5 py-5">
          <div className="h-64 rounded-lg bg-muted/40 flex items-end justify-around px-4 pb-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-1 items-end">
                {[0.6, 0.4, 0.8].map((h, j) => (
                  <div
                    key={j}
                    className="w-5 rounded-t bg-muted"
                    style={{ height: `${h * (40 + (i % 3) * 30)}px` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column section skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 space-y-1">
              <div className="h-4 w-44 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="px-5 py-5 h-56 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full bg-muted/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Table section skeleton */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20">
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="px-5 py-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-10 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal bar chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-muted/20 space-y-1">
              <div className="h-4 w-52 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted" />
            </div>
            <div className="px-5 py-5 space-y-3">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-3 w-28 rounded bg-muted shrink-0" />
                  <div
                    className="h-4 rounded-r bg-muted"
                    style={{ width: `${30 + Math.sin(j) * 20 + (j % 3) * 15}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
