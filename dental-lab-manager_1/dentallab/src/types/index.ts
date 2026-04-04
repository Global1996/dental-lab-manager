// src/types/index.ts
// Single source of truth for all application types.
// Every interface mirrors the real DB schema in 001_schema_and_seed.sql.
//
// Import with:  import type { Case, Material } from '@/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole    = 'admin' | 'manager' | 'technician'

export type UnitType    =
  | 'ml' | 'g' | 'kg' | 'mg'
  | 'piece' | 'pack' | 'box' | 'tube' | 'syringe'

// Matches the movement_type ENUM in the DB exactly.
// 'case_usage' was missing from the old MovementType — now added.
export type MovementType =
  | 'in'          // stock received / purchased
  | 'out'         // manual removal / wastage
  | 'case_usage'  // consumed for a patient case (auto-inserted by DB trigger)
  | 'adjustment'  // inventory correction
  | 'return'      // returned to supplier
  | 'expired'     // written off due to expiry

export type CaseStatus  =
  | 'draft' | 'in_progress' | 'awaiting_approval'
  | 'completed' | 'delivered' | 'cancelled'

export type WorkType    =
  | 'crown' | 'bridge' | 'veneer' | 'implant'
  | 'denture_full' | 'denture_partial'
  | 'orthodontic' | 'inlay_onlay' | 'night_guard' | 'other'

// ─── Base ─────────────────────────────────────────────────────────────────────

interface Base {
  id:         string
  created_at: string
}

interface Auditable extends Base {
  updated_at: string
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile extends Auditable {
  email:      string
  full_name:  string
  role:       UserRole
  avatar_url: string | null
  phone:      string | null
  is_active:  boolean
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category extends Base {
  name:        string
  description: string | null
  color:       string | null  // hex e.g. '#3B82F6'
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export interface Supplier extends Auditable {
  name:         string
  contact_name: string | null
  email:        string | null
  phone:        string | null
  address:      string | null
  website:      string | null
  notes:        string | null
  is_active:    boolean
}

// ─── Material ─────────────────────────────────────────────────────────────────
// Matches the `materials` table exactly. quantity is kept in sync by a DB trigger.

export interface Material extends Auditable {
  name:          string
  sku:           string | null
  category_id:   string | null
  supplier_id:   string | null
  unit:          UnitType
  quantity:      number   // current stock — updated by fn_sync_material_quantity trigger
  min_threshold: number   // low-stock alert threshold
  cost_per_unit: number   // current purchase price
  expiry_date:   string | null
  location:      string | null
  notes:         string | null
  is_active:     boolean
}

// Material joined with category + supplier — shape returned by list queries.
// Renamed from MaterialWithStock to MaterialWithJoins (no stock_levels join needed).
export interface MaterialWithJoins extends Material {
  categories: Pick<Category, 'id' | 'name' | 'color'> | null
  suppliers:  Pick<Supplier, 'id' | 'name'>           | null
}

// Kept as alias so existing imports still work
export type MaterialWithStock = MaterialWithJoins

// ─── StockMovement ────────────────────────────────────────────────────────────
// Matches the `stock_movements` table. Note: no performed_by / performed_at.

export interface StockMovement extends Base {
  material_id:   string
  movement_type: MovementType
  quantity:      number        // always positive
  unit_cost:     number | null // snapshot for 'in' movements
  reason:        string | null
  case_id:       string | null // required when movement_type = 'case_usage'
  batch_number:  string | null
  expiry_date:   string | null
  // Joined
  materials?: Pick<Material, 'name' | 'unit'> | null
}

// ─── Case ─────────────────────────────────────────────────────────────────────

export interface Case extends Base {
  case_code:      string  // auto-generated e.g. 'CASE-2024-0001'
  patient_name:   string
  clinic_name:    string | null
  doctor_name:    string | null
  work_type:      WorkType
  status:         CaseStatus
  tooth_numbers:  string | null
  shade:          string | null
  received_date:  string
  due_date:       string | null
  completed_date: string | null
  // Manual costs
  material_cost:  number  // auto-updated by DB trigger
  labor_cost:     number
  machine_cost:   number
  // DB GENERATED — never write to these
  total_cost:         number
  final_price:        number
  estimated_profit:   number
  profit_margin_pct:  number
  notes: string | null
}

// ─── CaseMaterialUsage ────────────────────────────────────────────────────────

export interface CaseMaterialUsage extends Base {
  case_id:           string
  material_id:       string
  quantity_used:     number
  unit_cost_at_time: number  // price snapshot — immutable after insert
  total_cost:        number  // DB GENERATED: quantity_used * unit_cost_at_time
  notes:             string | null
  materials?: Pick<Material, 'id' | 'name' | 'unit' | 'sku'> | null
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export type PoStatus = 'draft' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseOrder extends Base {
  updated_at:     string
  order_number:   string
  supplier_id:    string | null
  status:         PoStatus
  order_date:     string
  expected_date:  string | null
  received_date:  string | null
  notes:          string | null
  // Joined (optional — present when queried with .select('*, suppliers(...)'))
  suppliers?: Pick<Supplier, 'id' | 'name' | 'contact_name' | 'email' | 'phone'> | null
}

export interface PurchaseOrderItem extends Base {
  purchase_order_id: string
  material_id:       string | null
  material_name:     string     // snapshot
  unit:              string     // snapshot
  quantity_ordered:  number
  unit_cost:         number | null
  notes:             string | null
  // Joined
  materials?: Pick<Material, 'id' | 'name' | 'unit' | 'quantity'> | null
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'stock_in'
  | 'stock_out'
  | 'adjustment'

export type AuditEntityType =
  | 'material'
  | 'case'
  | 'stock_movement'

export interface AuditLog {
  id:           string
  created_at:   string
  user_id:      string | null
  user_name:    string
  action:       AuditAction
  entity_type:  AuditEntityType
  entity_id:    string | null
  entity_label: string | null
  details:      string | null
}
