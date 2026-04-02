'use client'
// src/components/materials/DeleteMaterialButton.tsx
// A small button that shows an inline confirmation before soft-deleting a material.
// We use a simple inline popover rather than a full dialog to keep it lightweight.

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deleteMaterial } from './materialActions'

interface Props {
  materialId:   string
  materialName: string
}

export function DeleteMaterialButton({ materialId, materialName }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMaterial(materialId)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`"${materialName}" deactivated`)
      setConfirming(false)
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground
                   hover:text-destructive transition-colors"
        aria-label={`Deactivate ${materialName}`}
        title="Deactivate material"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )
  }

  // Inline confirmation — replaces the button in the same table cell
  return (
    <div className="flex items-center gap-1.5 bg-destructive/5 border border-destructive/20
                    rounded-lg px-2 py-1 text-xs">
      <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
      <span className="text-destructive font-medium whitespace-nowrap">Deactivate?</span>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="ml-1 px-2 py-0.5 rounded bg-destructive text-destructive-foreground
                   font-medium hover:bg-destructive/90 disabled:opacity-50
                   flex items-center gap-1 transition-colors"
      >
        {isPending && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
        Yes
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="px-2 py-0.5 rounded border font-medium hover:bg-accent
                   disabled:opacity-50 transition-colors"
      >
        No
      </button>
    </div>
  )
}
