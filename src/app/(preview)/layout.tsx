// src/app/(preview)/layout.tsx
// Self-contained preview shell — no Supabase, no auth, no redirects.
// Displays the full app chrome (sidebar + topbar) using mock data.
// This layout is ONLY for local preview; delete before production.

import type { Metadata } from 'next'
import { PreviewSidebar } from './PreviewSidebar'
import { PreviewTopbar } from './PreviewTopbar'

export const metadata: Metadata = {
  title: { default: 'Preview · Dental Lab', template: '%s · Preview' },
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PreviewSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PreviewTopbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
