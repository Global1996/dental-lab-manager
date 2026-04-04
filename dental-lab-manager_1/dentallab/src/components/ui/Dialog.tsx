'use client'
// src/components/ui/Dialog.tsx
// Reusable modal dialog shell.
//
// WHY THIS FILE EXISTS:
//   Every dialog (AddMaterialDialog, EditMaterialDialog, CreateCaseDialog,
//   EditCaseDialog, StockInDialog, etc.) had the exact same markup:
//     - fixed overlay with backdrop
//     - rounded panel with max-height scroll
//     - sticky header with title + close button
//     - scrollable body
//     - sticky footer with Cancel + Submit
//
//   This component extracts that shell so each dialog only needs to provide
//   its title, content, and footer buttons — not re-implement the layout.
//
// USAGE:
//   <Dialog
//     open={open}
//     onClose={handleClose}
//     title="Add Material"
//     description="New item in the catalogue"
//     footer={<DialogFooter onCancel={handleClose} isSubmitting={isSubmitting} label="Add Material" />}
//   >
//     <MyFormFields />
//   </Dialog>

import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Dialog shell ─────────────────────────────────────────────────────────────

interface DialogProps {
  open:         boolean
  onClose:      () => void
  title:        string
  description?: string
  titleIcon?:   React.ReactNode
  /** Sticky footer — use <DialogFooter> or render custom buttons */
  footer:       React.ReactNode
  children:     React.ReactNode
  /** Max width class — defaults to 'max-w-2xl' */
  maxWidth?:    string
  /** Unique ID for aria-labelledby — defaults to 'dialog-title' */
  titleId?:     string
}

export function Dialog({
  open, onClose, title, description, titleIcon,
  footer, children, maxWidth = 'max-w-2xl', titleId = 'dialog-title',
}: DialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={cn(
        'relative z-10 w-full max-h-[92vh] overflow-y-auto',
        'rounded-2xl border bg-background shadow-2xl flex flex-col',
        maxWidth
      )}>

        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {titleIcon && (
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">{titleIcon}</div>
            )}
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold leading-tight">{title}</h2>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground
                       hover:text-foreground transition-colors ml-3 shrink-0"
            aria-label="Închide dialogul"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Sticky footer */}
        <div className="px-6 py-4 border-t bg-muted/30 sticky bottom-0 shrink-0">
          {footer}
        </div>

      </div>
    </div>
  )
}

// ─── DialogFooter ─────────────────────────────────────────────────────────────
// The standard Cancel + Submit footer used by most dialogs.

interface DialogFooterProps {
  onCancel:     () => void
  isSubmitting: boolean
  label:        string          // e.g. "Add Material", "Save Changes"
  loadingLabel?: string         // defaults to "Saving…"
  /** Set to 'destructive' for delete confirmations */
  variant?:     'default' | 'destructive'
  disabled?:    boolean
}

export function DialogFooter({
  onCancel, isSubmitting, label, loadingLabel = 'Se salvează…', variant = 'default', disabled,
}: DialogFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 rounded-lg border text-sm font-medium
                   hover:bg-accent transition-colors disabled:opacity-50"
      >
        Anulează
      </button>
      <button
        type="submit"
        disabled={isSubmitting || disabled}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
          'transition-colors disabled:opacity-50',
          variant === 'destructive'
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isSubmitting ? loadingLabel : label}
      </button>
    </div>
  )
}
