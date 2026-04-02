// src/app/(auth)/register/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <h2 className="text-lg font-semibold mb-1">Create an account</h2>
      <p className="text-sm text-muted-foreground mb-6">Join your dental lab team</p>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
