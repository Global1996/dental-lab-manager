'use client'
// src/components/auth/RoleGuard.tsx
// Client-side role gate for UI elements (not a security boundary —
// use requireRole() on the server for actual protection).
//
// Usage:
//   <RoleGuard role="admin">
//     <DeleteButton />        {/* only rendered for admins */}
//   </RoleGuard>
//
//   <RoleGuard role={['admin', 'manager']} fallback={<p>No access</p>}>
//     <ReportsPanel />
//   </RoleGuard>

import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface Props {
  role:      UserRole | UserRole[]
  children:  React.ReactNode
  fallback?: React.ReactNode   // shown when access is denied; default: nothing
}

export function RoleGuard({ role, children, fallback = null }: Props) {
  const { profile, isLoading } = useAuth()

  // Don't flash content while loading
  if (isLoading) return null

  const allowed = Array.isArray(role) ? role : [role]
  const hasRole = profile?.role && allowed.includes(profile.role)

  return hasRole ? <>{children}</> : <>{fallback}</>
}
