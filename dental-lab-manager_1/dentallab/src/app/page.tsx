// src/app/page.tsx
// Root route — redirects to /login.
// The middleware (middleware.ts) will forward logged-in users to /dashboard.

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
