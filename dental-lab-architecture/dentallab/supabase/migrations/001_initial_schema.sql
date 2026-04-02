-- =============================================================
-- Dental Lab Manager — PostgreSQL Schema
-- Migration: 001_initial_schema.sql
-- Run in Supabase SQL Editor or via `supabase db push`
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role        AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE unit_type        AS ENUM ('ml','g','kg','mg','piece','pack','box','tube','syringe');
CREATE TYPE movement_type    AS ENUM ('in','out','adjustment','return','expired');
CREATE TYPE case_status      AS ENUM ('draft','in_progress','awaiting_approval','completed','delivered','cancelled');
CREATE TYPE case_type        AS ENUM ('crown','bridge','veneer','implant','denture','orthodontic','inlay_onlay','other');

-- =============================================================
-- TABLE: profiles
-- Mirrors auth.users; created automatically via trigger on signup.
-- Stores role and display info used throughout the app.
-- =============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  full_name   TEXT        NOT NULL,
  role        user_role   NOT NULL DEFAULT 'technician',
  avatar_url  TEXT,
  phone       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: categories
-- Groups materials into logical families (ceramics, alloys, etc.)
-- Used for filtering in the materials list and reports.
-- =============================================================

CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  color       TEXT,                         -- hex colour for UI badges e.g. '#3B82F6'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: suppliers
-- Vendor contact records linked to materials and stock batches.
-- =============================================================

CREATE TABLE suppliers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  contact_name TEXT,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  website      TEXT,
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: materials
-- The product catalogue. Every item the lab stocks lives here.
-- unit_cost is the CURRENT purchase price; historical prices are
-- captured in stock_movements at the time of each transaction.
-- =============================================================

CREATE TABLE materials (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT            NOT NULL,
  description         TEXT,
  sku                 TEXT            UNIQUE,
  category_id         UUID            REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id         UUID            REFERENCES suppliers(id)  ON DELETE SET NULL,
  unit                unit_type       NOT NULL DEFAULT 'piece',
  unit_cost           NUMERIC(12,4)   NOT NULL DEFAULT 0,
  reorder_level       NUMERIC(12,4)   NOT NULL DEFAULT 0,   -- alert threshold
  reorder_quantity    NUMERIC(12,4)   NOT NULL DEFAULT 0,   -- suggested PO qty
  has_expiry          BOOLEAN         NOT NULL DEFAULT false,
  expiry_warning_days INT             NOT NULL DEFAULT 30,
  is_active           BOOLEAN         NOT NULL DEFAULT true,
  created_by          UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: stock_levels
-- Single-row per material holding the current quantity.
-- Maintained automatically by trigger on stock_movements.
-- Never write to this table directly.
-- =============================================================

CREATE TABLE stock_levels (
  material_id     UUID        PRIMARY KEY REFERENCES materials(id) ON DELETE CASCADE,
  total_quantity  NUMERIC(12,4) NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: stock_movements
-- Immutable audit log. Every quantity change — receipt, usage,
-- manual adjustment — is a row here. The balance is derived from
-- the materialized stock_levels table above.
-- =============================================================

CREATE TABLE stock_movements (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id    UUID          NOT NULL REFERENCES materials(id)  ON DELETE RESTRICT,
  movement_type  movement_type NOT NULL,
  quantity       NUMERIC(12,4) NOT NULL,    -- always positive; direction from type
  unit_cost      NUMERIC(12,4),             -- price snapshot at movement time
  batch_number   TEXT,
  expiry_date    DATE,
  reference_id   UUID,                      -- FK to case_material_usage if type='out'
  reference_type TEXT,                      -- 'case_usage' | 'purchase' | 'manual'
  notes          TEXT,
  performed_by   UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  performed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: patients
-- The person for whom lab work is being done.
-- Linked to cases; minimal PII kept here.
-- =============================================================

CREATE TABLE patients (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code    TEXT        UNIQUE NOT NULL,      -- auto-generated e.g. PT-2024-0001
  full_name       TEXT        NOT NULL,
  date_of_birth   DATE,
  phone           TEXT,
  email           TEXT,
  dentist_name    TEXT,
  dentist_clinic  TEXT,
  notes           TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  created_by      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: cases
-- A work order for one patient. Tracks costs, pricing, profit.
-- material_cost is kept in sync by trigger on case_material_usage.
-- total_cost and estimated_profit are GENERATED columns.
-- =============================================================

CREATE TABLE cases (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number      TEXT        UNIQUE NOT NULL,         -- e.g. CASE-2024-0001
  patient_id       UUID        REFERENCES patients(id) ON DELETE SET NULL,
  case_type        case_type   NOT NULL DEFAULT 'other',
  status           case_status NOT NULL DEFAULT 'draft',
  description      TEXT,
  tooth_numbers    TEXT[],                               -- e.g. ['11','12']
  shade            TEXT,

  received_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  completed_date   DATE,

  -- Cost components
  material_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,    -- auto-updated by trigger
  labor_cost       NUMERIC(12,2) NOT NULL DEFAULT 0,
  machine_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,
  overhead_cost    NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Computed columns (PostgreSQL generated)
  total_cost       NUMERIC(12,2) GENERATED ALWAYS AS
                     (material_cost + labor_cost + machine_cost + overhead_cost) STORED,

  final_price      NUMERIC(12,2) NOT NULL DEFAULT 0,

  estimated_profit NUMERIC(12,2) GENERATED ALWAYS AS
                     (final_price - (material_cost + labor_cost + machine_cost + overhead_cost)) STORED,

  profit_margin    NUMERIC(6,2)  GENERATED ALWAYS AS (
                     CASE WHEN final_price > 0
                       THEN ROUND((final_price - (material_cost + labor_cost + machine_cost + overhead_cost))
                            / final_price * 100, 2)
                       ELSE 0 END
                   ) STORED,

  assigned_to      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_by       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TABLE: case_material_usage
-- Records every material used on a specific case.
-- Inserting a row here automatically:
--   1. Deducts stock via trigger → stock_movements('out')
--   2. Rolls up material_cost on the parent case via trigger
-- unit_cost is SNAPSHOTTED at the time of assignment so
-- future price changes do not alter historical case costs.
-- =============================================================

CREATE TABLE case_material_usage (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id        UUID          NOT NULL REFERENCES cases(id)     ON DELETE CASCADE,
  material_id    UUID          NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity_used  NUMERIC(12,4) NOT NULL,
  unit_cost      NUMERIC(12,4) NOT NULL,   -- snapshot; NOT a live FK to materials.unit_cost
  line_total     NUMERIC(12,4) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  notes          TEXT,
  added_by       UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  added_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_qty_positive CHECK (quantity_used > 0)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_materials_category     ON materials(category_id);
CREATE INDEX idx_materials_supplier     ON materials(supplier_id);
CREATE INDEX idx_stock_movements_mat    ON stock_movements(material_id);
CREATE INDEX idx_stock_movements_at     ON stock_movements(performed_at DESC);
CREATE INDEX idx_cases_patient          ON cases(patient_id);
CREATE INDEX idx_cases_status           ON cases(status);
CREATE INDEX idx_case_usage_case        ON case_material_usage(case_id);
CREATE INDEX idx_case_usage_material    ON case_material_usage(material_id);

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- 1. Keep updated_at fresh ----------------------------------------

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_patients_updated_at  BEFORE UPDATE ON patients  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_cases_updated_at     BEFORE UPDATE ON cases     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2. Maintain stock_levels aggregate ----------------------------

CREATE OR REPLACE FUNCTION fn_sync_stock_level()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_delta NUMERIC;
BEGIN
  IF NEW.movement_type IN ('in','return') THEN
    v_delta :=  NEW.quantity;
  ELSIF NEW.movement_type IN ('out','expired') THEN
    v_delta := -NEW.quantity;
  ELSE -- adjustment: positive quantity = top-up, negative = reduction
    v_delta :=  NEW.quantity;
  END IF;

  INSERT INTO stock_levels (material_id, total_quantity, last_updated)
    VALUES (NEW.material_id, GREATEST(0, v_delta), NOW())
  ON CONFLICT (material_id) DO UPDATE
    SET total_quantity = GREATEST(0, stock_levels.total_quantity + v_delta),
        last_updated   = NOW();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_stock_level
AFTER INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_sync_stock_level();

-- 3. Guard against negative stock --------------------------------

CREATE OR REPLACE FUNCTION fn_prevent_negative_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_available NUMERIC;
BEGIN
  IF NEW.movement_type IN ('out','expired') THEN
    SELECT COALESCE(total_quantity, 0) INTO v_available
    FROM stock_levels WHERE material_id = NEW.material_id;
    IF v_available < NEW.quantity THEN
      RAISE EXCEPTION
        'Insufficient stock for material %. Available: %, Requested: %',
        NEW.material_id, v_available, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_prevent_negative_stock
BEFORE INSERT ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_prevent_negative_stock();

-- 4. Auto-deduct stock when case material usage is recorded -----

CREATE OR REPLACE FUNCTION fn_deduct_stock_on_case_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO stock_movements
    (material_id, movement_type, quantity, unit_cost, reference_id, reference_type, notes, performed_by)
  VALUES
    (NEW.material_id, 'out', NEW.quantity_used, NEW.unit_cost,
     NEW.id, 'case_usage', 'Auto-deducted for case', NEW.added_by);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_deduct_stock_on_case_usage
AFTER INSERT ON case_material_usage
FOR EACH ROW EXECUTE FUNCTION fn_deduct_stock_on_case_usage();

-- 5. Roll up material_cost on cases when usage changes ----------

CREATE OR REPLACE FUNCTION fn_rollup_case_material_cost()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_case_id UUID; v_total NUMERIC;
BEGIN
  v_case_id := COALESCE(NEW.case_id, OLD.case_id);
  SELECT COALESCE(SUM(line_total), 0) INTO v_total
  FROM case_material_usage WHERE case_id = v_case_id;
  UPDATE cases SET material_cost = v_total WHERE id = v_case_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_rollup_case_material_cost
AFTER INSERT OR UPDATE OR DELETE ON case_material_usage
FOR EACH ROW EXECUTE FUNCTION fn_rollup_case_material_cost();

-- 6. Auto-generate patient_code and case_number -----------------

CREATE SEQUENCE patient_seq START 1;
CREATE SEQUENCE case_seq    START 1;

CREATE OR REPLACE FUNCTION fn_gen_patient_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.patient_code IS NULL OR NEW.patient_code = '' THEN
    NEW.patient_code := 'PT-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('patient_seq')::TEXT, 4, '0');
  END IF; RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION fn_gen_case_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    NEW.case_number := 'CASE-' || TO_CHAR(NOW(),'YYYY') || '-' || LPAD(nextval('case_seq')::TEXT, 4, '0');
  END IF; RETURN NEW;
END; $$;

CREATE TRIGGER trg_gen_patient_code BEFORE INSERT ON patients FOR EACH ROW EXECUTE FUNCTION fn_gen_patient_code();
CREATE TRIGGER trg_gen_case_number  BEFORE INSERT ON cases    FOR EACH ROW EXECUTE FUNCTION fn_gen_case_number();

-- 7. Auto-create profile when a user signs up via Supabase Auth -

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'technician')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases              ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_material_usage ENABLE ROW LEVEL SECURITY;

-- Helper: current user's role
CREATE OR REPLACE FUNCTION fn_my_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Profiles: own row always; managers/admins see all
CREATE POLICY "profiles: own row"    ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles: mgr read"   ON profiles FOR SELECT USING (fn_my_role() IN ('admin','manager'));
CREATE POLICY "profiles: own update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles: admin all"  ON profiles FOR ALL   USING (fn_my_role() = 'admin');

-- Lookups (categories, suppliers): everyone authenticated can read
CREATE POLICY "categories: read" ON categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories: write" ON categories FOR ALL USING (fn_my_role() IN ('admin','manager'));
CREATE POLICY "suppliers: read"  ON suppliers  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "suppliers: write" ON suppliers  FOR ALL   USING (fn_my_role() IN ('admin','manager'));

-- Materials: read for all; write for manager+
CREATE POLICY "materials: read"  ON materials  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "materials: write" ON materials  FOR ALL   USING (fn_my_role() IN ('admin','manager'));

-- Stock: read for all; insert for all authenticated; delete only admin
CREATE POLICY "stock_levels: read"      ON stock_levels    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_movements: read"   ON stock_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_movements: insert" ON stock_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Patients & cases: all authenticated
CREATE POLICY "patients: all" ON patients FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "cases: read"   ON cases    FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "cases: insert" ON cases    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cases: update" ON cases    FOR UPDATE
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR fn_my_role() IN ('admin','manager'));

-- Case material usage: all authenticated can add; manager/admin can delete
CREATE POLICY "case_usage: read"   ON case_material_usage FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "case_usage: insert" ON case_material_usage FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "case_usage: delete" ON case_material_usage FOR DELETE
  USING (added_by = auth.uid() OR fn_my_role() IN ('admin','manager'));
