'use client'
// src/components/suppliers/DeleteSupplierButton.tsx
// Inline confirm-then-soft-delete button.
// Mirrors DeleteMaterialButton exactly — same pattern, different action.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deleteSupplier } from './supplierActions'

interface Props {
  supplierId:   string
  supplierName: string
}

export function DeleteSupplierButton({ supplierId, supplierName }: Props) {
  const [confirming, setConfirming]   = useState(false)
  const [isPending, startTransition]  = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSupplier(supplierId)
      if (!result.success) {
        toast.error(result.error)
        setConfirming(false)
        return
      }
      toast.success('Furnizor dezactivat', { description: supplierName })
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground
                   hover:text-destructive transition-colors"
        aria-label={`Dezactivează ${supplierName}`}
        title="Dezactivează furnizorul"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-destructive/5 border border-destructive/20
                    rounded-lg px-2 py-1 text-xs">
      <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
      <span className="text-destructive font-medium whitespace-nowrap">Dezactivezi?</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="ml-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground
                   font-medium hover:bg-destructive/90 disabled:opacity-50
                   flex items-center gap-1 transition-colors"
      >
        {isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
        Da
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="px-2 py-0.5 rounded border font-medium hover:bg-accent
                   disabled:opacity-50 transition-colors"
      >
        Nu
      </button>
    </div>
  )
}
