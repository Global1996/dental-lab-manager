// src/app/(auth)/login/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="rounded-2xl border bg-card shadow-sm p-8">
      <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
      <p className="text-sm text-muted-foreground mb-6">Sign in to your lab account</p>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        No account?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Register here
        </Link>
      </p>
    </div>
  )
}
