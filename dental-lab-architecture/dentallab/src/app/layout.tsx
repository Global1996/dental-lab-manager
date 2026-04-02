// src/app/layout.tsx
// The outermost layout — sets HTML shell, global font, and toast provider.
// Every route in the app (auth + app) is nested inside this.

import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Dental Lab Manager', template: '%s · Dental Lab' },
  description: 'Inventory, stock movements, case tracking and cost calculator for dental laboratories.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
