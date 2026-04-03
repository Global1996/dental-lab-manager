'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

const schema = z.object({
  full_name:        z.string().min(2, 'Introduceți numele complet'),
  email:            z.string().email('Introduceți o adresă de email validă'),
  role:             z.enum(['admin', 'manager', 'technician']),
  password:         z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  path: ['confirm_password'],
  message: 'Parolele nu coincid',
})
type FormValues = z.infer<typeof schema>

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'technician', label: 'Tehnician',     description: 'Creează cazuri și înregistrează consumul' },
  { value: 'manager',    label: 'Manager',        description: 'Gestionează stocul și vizualizează rapoartele' },
  { value: 'admin',      label: 'Administrator',  description: 'Acces complet, inclusiv gestionarea utilizatorilor' },
]

export function RegisterForm() {
  const router   = useRouter()
  const supabase = getSupabaseClient()
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'technician' },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email:    values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          role:      values.role,
        },
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Cont creat! Verificați emailul pentru confirmare înainte de autentificare.')
    router.push('/login')
  }

  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1.5">Nume complet</label>
        <input {...register('full_name')} id="full_name" type="text"
          placeholder="Dr. Maria Ionescu" autoComplete="name" className={inputClass} />
        {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name.message}</p>}
      </div>

      <div>
        <label htmlFor="reg_email" className="block text-sm font-medium mb-1.5">Adresă de email</label>
        <input {...register('email')} id="reg_email" type="email"
          placeholder="tu@labdentar.ro" autoComplete="email" className={inputClass} />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1.5">
          Rol
          <span className="ml-1.5 text-[10px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            dev/demo
          </span>
        </label>
        <select {...register('role')} id="role"
          className={inputClass + ' cursor-pointer'}>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
          ))}
        </select>
        {errors.role && <p className="text-xs text-destructive mt-1">{errors.role.message}</p>}
      </div>

      <div>
        <label htmlFor="reg_password" className="block text-sm font-medium mb-1.5">Parolă</label>
        <div className="relative">
          <input {...register('password')} id="reg_password"
            type={showPass ? 'text' : 'password'}
            placeholder="Cel puțin 8 caractere" autoComplete="new-password"
            className={inputClass + ' pr-10'} />
          <button type="button" onClick={() => setShowPass(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label={showPass ? 'Ascunde parola' : 'Arată parola'}>
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="confirm_password" className="block text-sm font-medium mb-1.5">Confirmă parola</label>
        <input {...register('confirm_password')} id="confirm_password"
          type={showPass ? 'text' : 'password'}
          placeholder="••••••••" autoComplete="new-password" className={inputClass} />
        {errors.confirm_password && (
          <p className="text-xs text-destructive mt-1">{errors.confirm_password.message}</p>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Se creează contul…' : 'Crează cont'}
      </button>

    </form>
  )
}
