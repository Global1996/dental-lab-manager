'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

const schema = z.object({
  email:    z.string().email('Introduceți o adresă de email validă'),
  password: z.string().min(1, 'Parola este obligatorie'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = getSupabaseClient()

  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(values)
    setLoading(false)

    if (error) {
      toast.error('Email sau parolă incorectă. Vă rugăm să încercați din nou.')
      return
    }

    const next = searchParams.get('next') ?? '/dashboard'
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Adresă de email
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@labdentar.ro"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm
                     placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     aria-invalid:border-destructive"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          Parolă
        </label>
        <div className="relative">
          <input
            {...register('password')}
            id="password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm
                       placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring
                       aria-invalid:border-destructive"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground
                       hover:text-foreground transition-colors"
            aria-label={showPass ? 'Ascunde parola' : 'Arată parola'}
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive mt-1" role="alert">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg
                   bg-primary text-primary-foreground py-2.5 text-sm font-medium
                   hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Se autentifică…' : 'Autentificare'}
      </button>

    </form>
  )
}
