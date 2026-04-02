// src/components/ui/FormField.tsx
// Tiny, reusable wrappers around label + input + error message.
// Keeps form code DRY across Add/Edit dialogs in every module.

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ─── FieldWrapper ─────────────────────────────────────────────────────────────

interface FieldWrapperProps {
  label:    string
  htmlFor?: string
  error?:   string
  hint?:    string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FieldWrapper({
  label, htmlFor, error, hint, required, children, className,
}: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium leading-none"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1" role="alert">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:ring-destructive/30',
        className,
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm',
        'placeholder:text-muted-foreground resize-none',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:ring-destructive/30',
        className,
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  placeholder?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, placeholder, options, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        error && 'border-destructive focus:ring-destructive/30',
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
)
Select.displayName = 'Select'

// ─── Checkbox ─────────────────────────────────────────────────────────────────

interface CheckboxFieldProps {
  id:       string
  label:    string
  hint?:    string
  checked:  boolean
  onChange: (checked: boolean) => void
}

export function CheckboxField({ id, label, hint, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border accent-primary cursor-pointer"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium cursor-pointer select-none">
          {label}
        </label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}
