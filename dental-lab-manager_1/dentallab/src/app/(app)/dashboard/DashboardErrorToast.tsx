'use client'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function DashboardErrorToast({ message }: { message: string }) {
  useEffect(() => {
    toast.error(message)
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }, [message])

  return null
}
