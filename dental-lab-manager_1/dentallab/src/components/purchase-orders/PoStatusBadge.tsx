// src/components/purchase-orders/PoStatusBadge.tsx
// Pill badge for purchase order status. Used in the list and detail views.

import { PO_STATUS_STYLES, PO_STATUS_OPTIONS, type PoStatus } from './poSchema'
import { cn } from '@/lib/utils'

interface Props {
  status: PoStatus
  className?: string
}

export function PoStatusBadge({ status, className }: Props) {
  const style = PO_STATUS_STYLES[status]
  const label = PO_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
        style.badge,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />
      {label}
    </span>
  )
}
