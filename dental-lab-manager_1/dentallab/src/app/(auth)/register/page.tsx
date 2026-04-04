// src/app/(auth)/register/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Creare cont' }

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <h2 className="text-lg font-semibold mb-1">Crează un cont</h2>
      <p className="text-sm text-muted-foreground mb-6">Alătură-te echipei laboratorului dentar</p>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Ai deja cont?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Autentifică-te
        </Link>
      </p>
    </div>
  )
}
