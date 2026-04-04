# Dental Lab Manager

A full-stack management application for dental laboratories — built with **Next.js 14**, **Supabase**, and **TypeScript**.

Track materials, manage stock movements, monitor patient cases, generate profitability reports, and handle purchase orders — all in a clean Romanian-language UI.

---

## Features

| Module | What it does |
|---|---|
| **Materials** | Catalogue with categories, suppliers, expiry dates, low-stock alerts |
| **Stock** | In / out / adjustment movements with full history timeline |
| **Cases** | Patient work orders with material usage tracking and cost calculator |
| **Reports** | Revenue, profit, margin trends, top materials — with date range filters |
| **Suppliers** | Vendor directory linked to materials |
| **Purchase Orders** | Draft → ordered → received flow, optional stock auto-update on receipt |
| **Alerts** | Automatic low-stock and expiry warnings on the dashboard |
| **Audit Log** | Who changed what and when — across materials, stock, and cases |

---

## Tech Stack

- **Framework** — Next.js 14 App Router (Server Components + Server Actions)
- **Database / Auth** — Supabase (PostgreSQL + Row Level Security)
- **Styling** — Tailwind CSS with CSS variables
- **Forms** — react-hook-form + Zod validation
- **Charts** — Recharts
- **UI** — Custom components, lucide-react icons, sonner toasts
- **Font** — Geist (Vercel)

---

## Local Setup

### Prerequisites

- **Node.js 18.17+** — check with `node -v`
- **A Supabase account** — free tier at [supabase.com](https://supabase.com)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/dental-lab-manager.git
cd dental-lab-manager
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name, a strong database password, and a region close to you
3. Wait ~2 minutes for the project to spin up

### 3. Run the database migrations

In your Supabase project, open **SQL Editor → New query** and run each file in order:

```
supabase/migrations/001_schema_and_seed.sql   ← tables, triggers, seed data
supabase/migrations/002_purchase_orders.sql   ← purchase orders module
supabase/migrations/003_audit_log.sql         ← activity audit log
```

Paste each file's contents into the editor and click **Run**. Each should return "Success. No rows returned."

### 4. Configure Supabase Auth

In **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/api/auth/callback`

In **Authentication → Settings**:
- For local development, turn **"Confirm email" OFF** so you can register and log in instantly.

### 5. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your three Supabase values from **Settings → API**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |

### 6. Run the development server

```bash
npm run dev
```

Open **http://localhost:3000** — you will be redirected to the login page.

### 7. Create your first account

1. Click **Înregistrare** on the login page
2. Enter your name, email, password, and choose **Admin** role
3. Log in — you will land on the **Dashboard**

---

## Available Scripts

```bash
npm run dev          # Start development server (hot reload)
npm run build        # Production build — run this before deploying
npm run start        # Start production server locally
npm run lint         # ESLint check
npm run type-check   # TypeScript check without emitting files
```

> Run `npm run build` locally before pushing to catch any TypeScript or build errors that would fail on Vercel.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Secret service role key (server only) |
| `NEXT_PUBLIC_APP_URL` | Optional | Full URL of the app (used in auth redirects) |
| `NEXT_PUBLIC_APP_NAME` | Optional | Display name in the UI |
| `NEXT_PUBLIC_CURRENCY` | Optional | Currency code for prices (default: USD) |

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework preset will be detected as **Next.js** automatically
4. Click **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ← mark as **Secret**
   - `NEXT_PUBLIC_APP_URL` ← set to your Vercel URL, e.g. `https://dental-lab.vercel.app`
5. Click **Deploy**

### 3. Update Supabase for production

In **Authentication → URL Configuration**, add your production URLs:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/api/auth/callback`

In **Authentication → Settings**, turn **"Confirm email" ON** for production.

### 4. Verify deployment

Open your Vercel URL. You should see the **login page** (`/login`). Register an account and confirm the dashboard loads correctly.

---

## Project Structure

```
dental-lab-manager/
├── src/
│   ├── app/
│   │   ├── (app)/          # Authenticated routes (dashboard, materials, cases…)
│   │   ├── (auth)/         # Login and register pages
│   │   ├── (preview)/      # Mock-data demo routes (no DB needed)
│   │   └── api/auth/       # Supabase auth callback handler
│   ├── components/
│   │   ├── cases/          # Case forms, table, material usage dialog
│   │   ├── materials/      # Material forms, table, CRUD actions
│   │   ├── stock/          # Stock movement dialogs and history table
│   │   ├── suppliers/      # Supplier CRUD
│   │   ├── purchase-orders/# PO creation, status flow, detail panel
│   │   ├── alerts/         # Alert cards, summary bar, critical banner
│   │   ├── dashboard/      # Stat cards, charts, widgets
│   │   ├── layout/         # Sidebar and topbar
│   │   └── ui/             # Shared: Dialog, FormField, SearchInput, ExportButton
│   ├── lib/
│   │   ├── actions.ts      # Shared server action helpers (ActionResult, mapDbError)
│   │   ├── audit.ts        # writeAuditLog() helper
│   │   ├── export.ts       # CSV and Excel export (no dependencies)
│   │   ├── alerts/         # Alert computation and Supabase query
│   │   ├── auth/           # requireRole(), getCurrentProfile()
│   │   └── supabase/       # Client, server, and middleware Supabase clients
│   └── types/
│       ├── index.ts        # All application types (mirrors DB schema)
│       └── supabase.ts     # Generated Supabase database types
├── supabase/
│   └── migrations/         # SQL migration files — run in order in Supabase SQL Editor
├── .env.example            # Template for required environment variables
├── middleware.ts            # Session refresh + route auth guard
└── next.config.js          # Next.js config (image domains)
```

---

## Troubleshooting

**"Invalid API key" / blank dashboard**
→ Check `.env.local` — the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must match your Supabase project exactly (no trailing slashes, no extra spaces).

**"relation 'materials' does not exist"**
→ You haven't run the SQL migrations. Open Supabase → SQL Editor and run all three migration files in order.

**"profile_missing" redirect loop after login**
→ The `fn_handle_new_user` trigger didn't fire when you registered. Re-run `001_schema_and_seed.sql` to ensure the trigger exists, then register a new account.

**Build error: "Cannot find module 'geist/font/sans'"**
→ Run `npm install` again.

**Vercel build fails with TypeScript errors**
→ Run `npm run build` locally first to see the exact errors. The most common cause is a type mismatch introduced by a recent edit.

**Vercel shows login page but login fails**
→ Confirm `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel's Environment Variables and that the Supabase Redirect URL includes `https://your-app.vercel.app/api/auth/callback`.

---

## License

MIT
# dental-lab-manager12
