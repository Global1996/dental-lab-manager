// src/app/(auth)/layout.tsx
// Wraps the login and register pages.
// Centres content on screen with a clean card presentation.
// No sidebar — these pages are pre-authentication.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg mb-4">
            DL
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Dental Lab Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory · Cases · Cost Calculator</p>
        </div>

        {children}
      </div>
    </div>
  )
}
