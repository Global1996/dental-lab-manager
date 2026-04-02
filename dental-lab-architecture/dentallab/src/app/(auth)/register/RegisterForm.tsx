'use client'
// src/app/(auth)/register/RegisterForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase/client'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router   = useRouter()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email:    values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Account created! Check your email to confirm.')
    router.push('/login')
  }

  const field = (label: string, name: keyof FormValues, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {errors[name] && <p className="text-xs text-destructive mt-1">{errors[name]?.message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {field('Full Name', 'full_name', 'text', 'Dr. Jane Smith')}
      {field('Email', 'email', 'email', 'you@dentallab.com')}
      {field('Password', 'password', 'password', '••••••••')}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
