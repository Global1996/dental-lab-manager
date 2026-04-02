// src/types/index.ts
// Central export for every application type.
// Import with:  import type { Case, Material } from '@/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole       = 'admin' | 'manager' | 'technician'
export type UnitType       = 'ml' | 'g' | 'kg' | 'mg' | 'piece' | 'pack' | 'box' | 'tube' | 'syringe'
export type MovementType   = 'in' | 'out' | 'adjustment' | 'return' | 'expired'
export type CaseStatus     = 'draft' | 'in_progress' | 'awaiting_approval' | 'completed' | 'delivered' | 'cancelled'
export type CaseType       = 'crown' | 'bridge' | 'veneer' | 'implant' | 'denture' | 'orthodontic' | 'inlay_onlay' | 'other'

// ─── Base ─────────────────────────────────────────────────────────────────────

interface Base {
  id: string
  created_at: string
}

interface Auditable extends Base {
  updated_at: string
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile extends Auditable {
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  phone: string | null
  is_active: boolean
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category extends Base {
  name: string
  description: string | null
  color: string | null            // hex e.g. '#3B82F6'
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export interface Supplier extends Auditable {
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  notes: string | null
  is_active: boolean
}

// ─── Material ─────────────────────────────────────────────────────────────────
// Matches the `materials` table in 001_initial_schema.sql exactly.

export interface Material extends Auditable {
  name: string
  description: string | null
  sku: string | null
  category_id: string | null
  supplier_id: string | null
  unit: UnitType
  unit_cost: number          // purchase price per unit
  reorder_level: number      // low-stock alert threshold
  reorder_quantity: number   // suggested order qty
  has_expiry: boolean
  expiry_warning_days: number
  is_active: boolean
  created_by: string | null
}

// Material row joined with category, supplier, and stock_levels —
// the shape returned by the materials list query.
export interface MaterialWithStock extends Material {
  categories: Pick<Category, 'id' | 'name' | 'color'> | null
  suppliers:  Pick<Supplier, 'id' | 'name'>           | null
  stock_levels: { total_quantity: number } | null
  // Computed client-side
  stock_status?: 'ok' | 'low' | 'out'
}

// ─── StockLevel ───────────────────────────────────────────────────────────────

export interface StockLevel {
  material_id: string
  total_quantity: number
  last_updated: string
}

// ─── StockMovement ────────────────────────────────────────────────────────────

export interface StockMovement extends Base {
  material_id: string
  movement_type: MovementType
  quantity: number
  unit_cost: number | null
  batch_number: string | null
  expiry_date: string | null
  reference_id: string | null
  reference_type: string | null
  notes: string | null
  performed_by: string | null
  performed_at: string
  // Joined
  material?: Material
  performed_by_profile?: Profile
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient extends Auditable {
  patient_code: string
  full_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  dentist_name: string | null
  dentist_clinic: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
}

// ─── Case ─────────────────────────────────────────────────────────────────────

export interface Case extends Auditable {
  case_number: string
  patient_id: string | null
  case_type: CaseType
  status: CaseStatus
  description: string | null
  tooth_numbers: string[] | null
  shade: string | null
  received_date: string
  due_date: string | null
  completed_date: string | null
  // Costs
  material_cost: number
  labor_cost: number
  machine_cost: number
  overhead_cost: number
  total_cost: number             // generated
  final_price: number
  estimated_profit: number       // generated
  profit_margin: number          // generated
  assigned_to: string | null
  created_by: string | null
  notes: string | null
  // Joined
  patient?: Patient
  case_material_usage?: CaseMaterialUsage[]
}

// ─── CaseMaterialUsage ────────────────────────────────────────────────────────

export interface CaseMaterialUsage extends Base {
  case_id: string
  material_id: string
  quantity_used: number
  unit_cost: number          // snapshot — not live from materials table
  line_total: number         // generated
  notes: string | null
  added_by: string | null
  added_at: string
  // Joined
  material?: Material
}

// ─── View-model helpers ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalMaterials: number
  lowStockCount: number
  outOfStockCount: number
  openCases: number
  completedThisMonth: number
  revenueThisMonth: number
  profitThisMonth: number
}

export interface CostBreakdown {
  materialCost: number
  laborCost: number
  machineCost: number
  overheadCost: number
  totalCost: number
  finalPrice: number
  estimatedProfit: number
  profitMargin: number
}
