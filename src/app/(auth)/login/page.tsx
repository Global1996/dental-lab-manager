// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Autentificare' }

export default function LoginPage() {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <h2 className="text-lg font-semibold mb-1">Bine ai revenit</h2>
      <p className="text-sm text-muted-foreground mb-6">Autentifică-te în contul laboratorului</p>
      {/* Suspense required by Next.js 14 — LoginForm uses useSearchParams() */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted/40" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Nu ai cont?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Înregistrează-te
        </Link>
      </p>
    </div>
  )
}
