// src/types/supabase.ts
// Database type definitions matching 001_schema_and_seed.sql exactly.
//
// To regenerate from a live Supabase project:
//   npx supabase gen types typescript --project-id YOUR_ID > src/types/supabase.ts
//
// IMPORTANT: This file must stay in sync with the migration SQL.
// Key facts about this schema:
//   - materials.quantity is updated by fn_sync_material_quantity trigger
//   - materials has NO stock_levels table — quantity is a direct column
//   - stock_movements uses: reason, case_id, created_at (NOT performed_at/reference_id)
//   - cases.total_cost, estimated_profit, profit_margin_pct are GENERATED columns
//   - cases uses case_code (NOT case_number)

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          email:      string
          full_name:  string
          role:       'admin' | 'manager' | 'technician'
          avatar_url: string | null
          phone:      string | null
          is_active:  boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'],
          'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      categories: {
        Row: {
          id:          string
          name:        string
          description: string | null
          color:       string | null   // hex e.g. '#3B82F6'
          created_at:  string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'],
          'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }

      suppliers: {
        Row: {
          id:           string
          name:         string
          contact_name: string | null
          email:        string | null
          phone:        string | null
          address:      string | null
          website:      string | null
          notes:        string | null
          is_active:    boolean
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'],
          'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
      }

      materials: {
        Row: {
          id:            string
          name:          string
          sku:           string | null
          category_id:   string | null
          supplier_id:   string | null
          unit:          string           // material_unit enum value
          quantity:      number           // kept in sync by fn_sync_material_quantity trigger
          min_threshold: number           // low-stock alert threshold
          cost_per_unit: number           // current purchase price
          expiry_date:   string | null
          location:      string | null
          notes:         string | null
          is_active:     boolean
          created_at:    string
          updated_at:    string
        }
        Insert: Omit<Database['public']['Tables']['materials']['Row'],
          'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['materials']['Insert']>
      }

      stock_movements: {
        Row: {
          id:            string
          material_id:   string
          movement_type: string          // movement_type enum value
          quantity:      number          // always positive
          unit_cost:     number | null   // price snapshot for 'in' movements
          reason:        string | null
          case_id:       string | null   // set when movement_type = 'case_usage'
          batch_number:  string | null
          expiry_date:   string | null
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'],
          'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
      }

      cases: {
        Row: {
          id:              string
          case_code:       string          // auto-generated e.g. 'CASE-2024-0001'
          patient_name:    string
          clinic_name:     string | null
          doctor_name:     string | null
          work_type:       string          // work_type enum value
          status:          string          // case_status enum value
          tooth_numbers:   string | null
          shade:           string | null
          received_date:   string
          due_date:        string | null
          completed_date:  string | null
          material_cost:   number          // auto-updated by fn_rollup_case_material_cost
          labor_cost:      number
          machine_cost:    number
          total_cost:      number          // GENERATED: material + labor + machine
          final_price:     number
          estimated_profit:  number        // GENERATED: final_price - total_cost
          profit_margin_pct: number        // GENERATED: (estimated_profit / final_price) * 100
          notes:           string | null
          created_at:      string
          updated_at:      string
        }
        Insert: Omit<Database['public']['Tables']['cases']['Row'],
          'id' | 'case_code' | 'total_cost' | 'estimated_profit' | 'profit_margin_pct'
          | 'created_at' | 'updated_at'>
          & { id?: string; case_code?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['cases']['Insert']>
      }

      case_material_usage: {
        Row: {
          id:                string
          case_id:           string
          material_id:       string
          quantity_used:     number
          unit_cost_at_time: number   // price snapshot — immutable after insert
          total_cost:        number   // GENERATED: quantity_used * unit_cost_at_time
          notes:             string | null
          created_at:        string
        }
        Insert: Omit<Database['public']['Tables']['case_material_usage']['Row'],
          'id' | 'total_cost' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['case_material_usage']['Insert']>
      }
    }


      purchase_orders: {
        Row: {
          id:             string
          order_number:   string
          supplier_id:    string | null
          status:         'draft' | 'ordered' | 'received' | 'cancelled'
          order_date:     string
          expected_date:  string | null
          received_date:  string | null
          notes:          string | null
          created_at:     string
          updated_at:     string
        }
        Insert: Omit<Database['public']['Tables']['purchase_orders']['Row'],
          'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['purchase_orders']['Insert']>
      }

      purchase_order_items: {
        Row: {
          id:                  string
          purchase_order_id:   string
          material_id:         string | null
          material_name:       string
          unit:                string
          quantity_ordered:    number
          unit_cost:           number | null
          notes:               string | null
          created_at:          string
        }
        Insert: Omit<Database['public']['Tables']['purchase_order_items']['Row'],
          'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['purchase_order_items']['Insert']>
      }

      audit_logs: {
        Row: {
          id:           string
          created_at:   string
          user_id:      string | null
          user_name:    string
          action:       string
          entity_type:  string
          entity_id:    string | null
          entity_label: string | null
          details:      string | null
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'],
          'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }

    Enums: {
      material_unit:  'ml' | 'g' | 'kg' | 'mg' | 'piece' | 'pack' | 'box' | 'tube' | 'syringe'
      movement_type:  'in' | 'out' | 'case_usage' | 'adjustment' | 'return' | 'expired'
      case_status:    'draft' | 'in_progress' | 'awaiting_approval' | 'completed' | 'delivered' | 'cancelled'
      work_type:      'crown' | 'bridge' | 'veneer' | 'implant' | 'denture_full' | 'denture_partial'
                    | 'orthodontic' | 'inlay_onlay' | 'night_guard' | 'other'
      user_role:      'admin' | 'manager' | 'technician'
      po_status:      'draft' | 'ordered' | 'received' | 'cancelled'
    }
  }
}

// Convenience helpers — import these instead of the full Database type
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
