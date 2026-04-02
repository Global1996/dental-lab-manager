// src/types/supabase.ts
// Shape of the Supabase-generated database types.
// Regenerate from your live project with:
//   npx supabase gen types typescript --project-id YOUR_ID > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; email: string; full_name: string
          role: 'admin' | 'manager' | 'technician'
          avatar_url: string | null; phone: string | null
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      categories: {
        Row: { id: string; name: string; description: string | null; color: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      suppliers: {
        Row: {
          id: string; name: string; contact_name: string | null; email: string | null
          phone: string | null; address: string | null; website: string | null
          notes: string | null; is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
      }
      materials: {
        Row: {
          id: string; name: string; description: string | null; sku: string | null
          category_id: string | null; supplier_id: string | null
          unit: string; unit_cost: number; reorder_level: number; reorder_quantity: number
          has_expiry: boolean; expiry_warning_days: number; is_active: boolean
          created_by: string | null; created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['materials']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['materials']['Insert']>
      }
      stock_levels: {
        Row: { material_id: string; total_quantity: number; last_updated: string }
        Insert: { material_id: string; total_quantity?: number; last_updated?: string }
        Update: { total_quantity?: number; last_updated?: string }
      }
      stock_movements: {
        Row: {
          id: string; material_id: string; movement_type: string; quantity: number
          unit_cost: number | null; batch_number: string | null; expiry_date: string | null
          reference_id: string | null; reference_type: string | null
          notes: string | null; performed_by: string | null; performed_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'performed_at'> & { id?: string; performed_at?: string }
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
      }
      patients: {
        Row: {
          id: string; patient_code: string; full_name: string
          date_of_birth: string | null; phone: string | null; email: string | null
          dentist_name: string | null; dentist_clinic: string | null
          notes: string | null; is_active: boolean; created_by: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['patients']['Row'], 'id' | 'patient_code' | 'created_at' | 'updated_at'> & { id?: string; patient_code?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['patients']['Insert']>
      }
      cases: {
        Row: {
          id: string; case_number: string; patient_id: string | null
          case_type: string; status: string; description: string | null
          tooth_numbers: string[] | null; shade: string | null
          received_date: string; due_date: string | null; completed_date: string | null
          material_cost: number; labor_cost: number; machine_cost: number; overhead_cost: number
          total_cost: number; final_price: number; estimated_profit: number; profit_margin: number
          assigned_to: string | null; created_by: string | null; notes: string | null
          created_at: string; updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['cases']['Row'], 'id' | 'case_number' | 'total_cost' | 'estimated_profit' | 'profit_margin' | 'created_at' | 'updated_at'> & { id?: string; case_number?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['cases']['Insert']>
      }
      case_material_usage: {
        Row: {
          id: string; case_id: string; material_id: string
          quantity_used: number; unit_cost: number; line_total: number
          notes: string | null; added_by: string | null; added_at: string
        }
        Insert: Omit<Database['public']['Tables']['case_material_usage']['Row'], 'id' | 'line_total' | 'added_at'> & { id?: string; added_at?: string }
        Update: Partial<Database['public']['Tables']['case_material_usage']['Insert']>
      }
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'technician'
      unit_type: 'ml' | 'g' | 'kg' | 'mg' | 'piece' | 'pack' | 'box' | 'tube' | 'syringe'
      movement_type: 'in' | 'out' | 'adjustment' | 'return' | 'expired'
      case_status: 'draft' | 'in_progress' | 'awaiting_approval' | 'completed' | 'delivered' | 'cancelled'
      case_type: 'crown' | 'bridge' | 'veneer' | 'implant' | 'denture' | 'orthodontic' | 'inlay_onlay' | 'other'
    }
  }
}

// Convenience helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
