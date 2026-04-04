// src/app/(app)/audit/loading.tsx
export default function AuditLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 border-b bg-muted/40">
          {[80, 100, 80, 80, 120, 200].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w}px`, maxWidth: '100%' }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-4 py-3.5 border-b last:border-0 items-center">
            <div className="space-y-1">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted font-mono" />
            <div className="space-y-1">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
