-- ============================================================
-- DENTAL LAB INVENTORY & PATIENT COST CALCULATOR
-- PostgreSQL Schema + Seed Data
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE material_unit AS ENUM (
  'ml', 'g', 'kg', 'mg',
  'piece', 'pack', 'box', 'tube', 'syringe', 'capsule'
);

CREATE TYPE movement_type AS ENUM (
  'in',           -- stock received / purchased
  'out',          -- manual removal / wastage
  'case_usage',   -- consumed for a patient case
  'adjustment',   -- inventory correction
  'return',       -- returned to supplier
  'expired'       -- written off due to expiry
);

CREATE TYPE case_status AS ENUM (
  'draft',
  'in_progress',
  'awaiting_approval',
  'completed',
  'delivered',
  'cancelled'
);

CREATE TYPE work_type AS ENUM (
  'crown',
  'bridge',
  'veneer',
  'implant_crown',
  'denture_full',
  'denture_partial',
  'inlay_onlay',
  'night_guard',
  'orthodontic_retainer',
  'other'
);


-- ============================================================
-- TABLE: categories
-- Groups materials into logical families (ceramics, alloys…).
-- ============================================================

CREATE TABLE categories (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  color       CHAR(7),                          -- hex colour for UI, e.g. '#3B82F6'
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_categories_name UNIQUE (name),
  CONSTRAINT chk_categories_color CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_categories_name ON categories (name);


-- ============================================================
-- TABLE: suppliers
-- Vendor contact records linked to materials.
-- ============================================================

CREATE TABLE suppliers (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(150)  NOT NULL,
  contact_name VARCHAR(100),
  email        VARCHAR(150),
  phone        VARCHAR(30),
  address      TEXT,
  website      VARCHAR(200),
  notes        TEXT,
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_suppliers_name  UNIQUE (name),
  CONSTRAINT chk_suppliers_email CHECK (email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX idx_suppliers_name      ON suppliers (name);
CREATE INDEX idx_suppliers_is_active ON suppliers (is_active);


-- ============================================================
-- TABLE: materials
-- The product catalogue. Every item the lab stocks lives here.
-- `quantity` is the current on-hand balance, kept in sync by
-- a trigger on stock_movements (see below).
-- ============================================================

CREATE TABLE materials (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(150)   NOT NULL,
  sku            VARCHAR(80)    NOT NULL,
  category_id    UUID           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  supplier_id    UUID           REFERENCES suppliers(id) ON DELETE SET NULL,
  unit           material_unit  NOT NULL DEFAULT 'piece',
  quantity       NUMERIC(12,4)  NOT NULL DEFAULT 0,
  min_threshold  NUMERIC(12,4)  NOT NULL DEFAULT 0,     -- triggers low-stock alert
  cost_per_unit  NUMERIC(12,4)  NOT NULL DEFAULT 0,     -- current purchase price
  expiry_date    DATE,
  location       VARCHAR(100),                          -- shelf / cabinet reference
  notes          TEXT,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_materials_sku         UNIQUE (sku),
  CONSTRAINT chk_materials_quantity   CHECK (quantity   >= 0),
  CONSTRAINT chk_materials_threshold  CHECK (min_threshold >= 0),
  CONSTRAINT chk_materials_cost       CHECK (cost_per_unit >= 0)
);

CREATE INDEX idx_materials_sku         ON materials (sku);
CREATE INDEX idx_materials_category    ON materials (category_id);
CREATE INDEX idx_materials_supplier    ON materials (supplier_id);
CREATE INDEX idx_materials_is_active   ON materials (is_active);
CREATE INDEX idx_materials_expiry_date ON materials (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_materials_low_stock   ON materials (quantity, min_threshold)
  WHERE quantity <= min_threshold AND is_active = TRUE;


-- ============================================================
-- TABLE: cases
-- A patient work order. Costs roll up from case_material_usage.
-- material_cost is kept in sync by a trigger (see below).
-- total_cost and estimated_profit are GENERATED columns.
-- ============================================================

CREATE TABLE cases (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_code        VARCHAR(30)   NOT NULL,           -- e.g. CASE-2024-0001
  patient_name     VARCHAR(150)  NOT NULL,
  clinic_name      VARCHAR(150),
  doctor_name      VARCHAR(150),
  work_type        work_type     NOT NULL DEFAULT 'other',
  status           case_status   NOT NULL DEFAULT 'draft',
  tooth_numbers    VARCHAR(100),                     -- e.g. '11, 12, 13'
  shade            VARCHAR(30),                      -- e.g. 'A2', 'B1 HT'
  received_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  completed_date   DATE,

  -- Cost components (labour and machine entered manually)
  material_cost    NUMERIC(12,2) NOT NULL DEFAULT 0, -- auto-updated by trigger
  labor_cost       NUMERIC(12,2) NOT NULL DEFAULT 0,
  machine_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Derived totals (PostgreSQL GENERATED columns)
  total_cost       NUMERIC(12,2) GENERATED ALWAYS AS
                     (material_cost + labor_cost + machine_cost) STORED,

  final_price      NUMERIC(12,2) NOT NULL DEFAULT 0,

  estimated_profit NUMERIC(12,2) GENERATED ALWAYS AS
                     (final_price - (material_cost + labor_cost + machine_cost)) STORED,

  profit_margin_pct NUMERIC(6,2) GENERATED ALWAYS AS (
                     CASE WHEN final_price > 0
                       THEN ROUND(
                         (final_price - (material_cost + labor_cost + machine_cost))
                         / final_price * 100, 2)
                       ELSE 0
                     END
                   ) STORED,

  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_cases_case_code      UNIQUE (case_code),
  CONSTRAINT chk_cases_labor_cost    CHECK (labor_cost   >= 0),
  CONSTRAINT chk_cases_machine_cost  CHECK (machine_cost >= 0),
  CONSTRAINT chk_cases_final_price   CHECK (final_price  >= 0),
  CONSTRAINT chk_cases_due_after_rx  CHECK (due_date IS NULL OR due_date >= received_date)
);

CREATE INDEX idx_cases_case_code     ON cases (case_code);
CREATE INDEX idx_cases_status        ON cases (status);
CREATE INDEX idx_cases_work_type     ON cases (work_type);
CREATE INDEX idx_cases_patient_name  ON cases (patient_name);
CREATE INDEX idx_cases_doctor_name   ON cases (doctor_name);
CREATE INDEX idx_cases_received_date ON cases (received_date DESC);
CREATE INDEX idx_cases_due_date      ON cases (due_date) WHERE due_date IS NOT NULL;


-- ============================================================
-- TABLE: stock_movements
-- Immutable audit log. Every quantity change is one row here.
-- The materials.quantity balance is derived from this table
-- via the trigger below — never update it directly.
-- ============================================================

CREATE TABLE stock_movements (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id    UUID           NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  movement_type  movement_type  NOT NULL,
  quantity       NUMERIC(12,4)  NOT NULL,   -- always positive; direction inferred from type
  unit_cost      NUMERIC(12,4),             -- purchase cost snapshot (for 'in' movements)
  reason         TEXT,
  case_id        UUID           REFERENCES cases(id) ON DELETE SET NULL,
  batch_number   VARCHAR(80),
  expiry_date    DATE,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_movements_quantity  CHECK (quantity > 0),
  CONSTRAINT chk_movements_unit_cost CHECK (unit_cost IS NULL OR unit_cost >= 0),
  -- case_id is required when movement_type = 'case_usage'
  CONSTRAINT chk_movements_case_id   CHECK (
    (movement_type = 'case_usage' AND case_id IS NOT NULL)
    OR movement_type <> 'case_usage'
  )
);

CREATE INDEX idx_movements_material_id  ON stock_movements (material_id);
CREATE INDEX idx_movements_case_id      ON stock_movements (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_movements_type         ON stock_movements (movement_type);
CREATE INDEX idx_movements_created_at   ON stock_movements (created_at DESC);


-- ============================================================
-- TABLE: case_material_usage
-- Records exactly which materials were used for each case.
-- Inserting a row here:
--   1. Snapshots unit_cost so future price changes don't affect history
--   2. Auto-inserts a stock_movements 'case_usage' row via trigger
--   3. Rolls up material_cost on the parent case via trigger
-- ============================================================

CREATE TABLE case_material_usage (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id           UUID          NOT NULL REFERENCES cases(id)     ON DELETE CASCADE,
  material_id       UUID          NOT NULL REFERENCES materials(id)  ON DELETE RESTRICT,
  quantity_used     NUMERIC(12,4) NOT NULL,
  unit_cost_at_time NUMERIC(12,4) NOT NULL,   -- price snapshot — intentionally denormalised
  total_cost        NUMERIC(12,4) GENERATED ALWAYS AS
                      (quantity_used * unit_cost_at_time) STORED,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_usage_quantity  CHECK (quantity_used     > 0),
  CONSTRAINT chk_usage_unit_cost CHECK (unit_cost_at_time >= 0)
);

CREATE INDEX idx_usage_case_id     ON case_material_usage (case_id);
CREATE INDEX idx_usage_material_id ON case_material_usage (material_id);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Keep updated_at fresh on materials and cases ─────────────

CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();


-- 2. Keep materials.quantity in sync with stock_movements ─────
--    Called AFTER INSERT on stock_movements.
--    Adds for 'in' / 'return'; subtracts for everything else.

CREATE OR REPLACE FUNCTION fn_sync_material_quantity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_delta NUMERIC;
BEGIN
  CASE NEW.movement_type
    WHEN 'in',     'return'   THEN v_delta :=  NEW.quantity;
    WHEN 'out', 'case_usage',
         'adjustment', 'expired'   THEN v_delta := -NEW.quantity;
    ELSE v_delta := 0;
  END CASE;

  UPDATE materials
     SET quantity = GREATEST(0, quantity + v_delta)
   WHERE id = NEW.material_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_material_quantity
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_sync_material_quantity();


-- 3. Guard: prevent stock going below zero ────────────────────

CREATE OR REPLACE FUNCTION fn_prevent_negative_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_current NUMERIC;
BEGIN
  IF NEW.movement_type IN ('out','case_usage','expired','adjustment') THEN
    SELECT quantity INTO v_current FROM materials WHERE id = NEW.material_id;
    IF v_current < NEW.quantity THEN
      RAISE EXCEPTION
        'Insufficient stock for material %. Available: %, Requested: %',
        NEW.material_id, v_current, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_negative_stock
  BEFORE INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_negative_stock();


-- 4. Auto-insert stock_movements row when case_material_usage
--    is created, so the audit trail is always complete. ────────

CREATE OR REPLACE FUNCTION fn_auto_movement_on_case_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO stock_movements
    (material_id, movement_type, quantity, unit_cost, reason, case_id)
  VALUES
    (NEW.material_id, 'case_usage', NEW.quantity_used,
     NEW.unit_cost_at_time,
     'Auto-deducted for case ' || (SELECT case_code FROM cases WHERE id = NEW.case_id),
     NEW.case_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_movement_on_case_usage
  AFTER INSERT ON case_material_usage
  FOR EACH ROW EXECUTE FUNCTION fn_auto_movement_on_case_usage();


-- 5. Roll up case_material_usage totals → cases.material_cost ─

CREATE OR REPLACE FUNCTION fn_rollup_case_material_cost()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_case_id UUID;
  v_total   NUMERIC;
BEGIN
  v_case_id := COALESCE(NEW.case_id, OLD.case_id);

  SELECT COALESCE(SUM(total_cost), 0)
    INTO v_total
    FROM case_material_usage
   WHERE case_id = v_case_id;

  UPDATE cases SET material_cost = v_total WHERE id = v_case_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rollup_case_material_cost
  AFTER INSERT OR UPDATE OR DELETE ON case_material_usage
  FOR EACH ROW EXECUTE FUNCTION fn_rollup_case_material_cost();


-- 6. Auto-generate case_code before insert ────────────────────

CREATE SEQUENCE IF NOT EXISTS case_code_seq START 1;

CREATE OR REPLACE FUNCTION fn_gen_case_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.case_code IS NULL OR TRIM(NEW.case_code) = '' THEN
    NEW.case_code := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-'
                     || LPAD(nextval('case_code_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gen_case_code
  BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION fn_gen_case_code();


-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories ─────────────────────────────────────────────────

INSERT INTO categories (id, name, description, color) VALUES
  ('cat-00000000-0000-0000-0000-000000000001', 'Ceramics',        'Feldspathic, zirconia, and lithium disilicate materials', '#3B82F6'),
  ('cat-00000000-0000-0000-0000-000000000002', 'Metal Alloys',    'Base metal, precious, and semi-precious casting alloys',  '#EAB308'),
  ('cat-00000000-0000-0000-0000-000000000003', 'Impression',      'Alginate, silicone, and polyether impression materials',  '#8B5CF6'),
  ('cat-00000000-0000-0000-0000-000000000004', 'Gypsum / Stone',  'Die stone, model plaster, and investment materials',      '#F97316'),
  ('cat-00000000-0000-0000-0000-000000000005', 'Adhesives & Cements', 'Resin cements, bonding agents, and glazes',           '#EC4899'),
  ('cat-00000000-0000-0000-0000-000000000006', 'Wax & Resin',     'Pattern wax, bite registration, and modelling resin',    '#14B8A6'),
  ('cat-00000000-0000-0000-0000-000000000007', 'Consumables',     'Polishing discs, burs, sandpaper, and lab sundries',     '#6B7280');


-- Suppliers ───────────────────────────────────────────────────

INSERT INTO suppliers (id, name, contact_name, email, phone, website) VALUES
  ('sup-00000000-0000-0000-0000-000000000001', 'Ivoclar Vivadent',  'James Hooper',  'orders@ivoclar.com',          '+1-800-533-6825', 'https://www.ivoclar.com'),
  ('sup-00000000-0000-0000-0000-000000000002', 'Dentsply Sirona',   'Linda Marsh',   'labsupply@dentsply.com',      '+1-800-877-0020', 'https://www.dentsplysirona.com'),
  ('sup-00000000-0000-0000-0000-000000000003', 'GC Corporation',    'Kenji Watanabe','gcamerica@gcamerica.com',     '+1-800-323-7063', 'https://www.gcamerica.com'),
  ('sup-00000000-0000-0000-0000-000000000004', 'Shofu Dental',      'Maria Santos',  'info@shofu.com',              '+1-800-827-4638', 'https://www.shofu.com'),
  ('sup-00000000-0000-0000-0000-000000000005', 'Renfert GmbH',      'Klaus Weber',   'info@renfert.com',            '+49-7741-2008-0', 'https://www.renfert.com'),
  ('sup-00000000-0000-0000-0000-000000000006', 'Whip Mix',          'Carol Jensen',  'customerservice@whipmix.com', '+1-800-626-5651', 'https://www.whipmix.com');


-- Materials ───────────────────────────────────────────────────

INSERT INTO materials
  (id, name, sku, category_id, supplier_id, unit, quantity, min_threshold, cost_per_unit, expiry_date, location, notes)
VALUES
  -- Ceramics
  ('mat-00000000-0000-0000-0000-000000000001',
   'IPS e.max CAD Block A2 LT C14',
   'IPS-EMAXCAD-A2LT-C14',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'piece', 40, 10, 18.50, NULL, 'Shelf A-1',
   'Lithium disilicate CAD/CAM block for anterior crowns'),

  ('mat-00000000-0000-0000-0000-000000000002',
   'IPS e.max CAD Block B1 HT C14',
   'IPS-EMAXCAD-B1HT-C14',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'piece', 28, 10, 18.50, NULL, 'Shelf A-1',
   'High translucency lithium disilicate block'),

  ('mat-00000000-0000-0000-0000-000000000003',
   'Zirconia Disc 98mm A2 Multi-Layer',
   'ZIRC-98-A2-ML',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000002',
   'piece', 15, 5, 44.00, NULL, 'Shelf A-2',
   '98mm milling disc, full contour zirconia'),

  ('mat-00000000-0000-0000-0000-000000000004',
   'IPS Ivocolor Essence E01 White',
   'IPS-IVOCOLOR-E01',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'g', 12, 4, 6.80, '2026-03-31', 'Cabinet B-3',
   'Staining liquid for IPS e.max characterisation'),

  ('mat-00000000-0000-0000-0000-000000000005',
   'Shofu Ceramage Dentin A2',
   'SHO-CER-DEN-A2',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000004',
   'g', 50, 15, 5.20, '2026-08-15', 'Cabinet B-3',
   'Supranano composite ceramic for layering technique'),

  -- Metal alloys
  ('mat-00000000-0000-0000-0000-000000000006',
   'Degudent U Base Metal Alloy',
   'DEG-U-ALLOY-100G',
   'cat-00000000-0000-0000-0000-000000000002',
   'sup-00000000-0000-0000-0000-000000000002',
   'g', 300, 50, 0.92, NULL, 'Safe D-1',
   'Ni-Cr-Mo alloy for metal-ceramic restorations'),

  ('mat-00000000-0000-0000-0000-000000000007',
   'Bellabond Plus Gold Alloy',
   'BELLA-GOLD-PLUS',
   'cat-00000000-0000-0000-0000-000000000002',
   'sup-00000000-0000-0000-0000-000000000005',
   'g', 80, 20, 58.40, NULL, 'Safe D-2',
   'High-gold alloy 86.0 Au for full-cast crowns'),

  -- Impression materials
  ('mat-00000000-0000-0000-0000-000000000008',
   'Zhermack Elite HD+ Light Body',
   'ZHE-ELITE-HDFLD',
   'cat-00000000-0000-0000-0000-000000000003',
   'sup-00000000-0000-0000-0000-000000000003',
   'ml', 240, 50, 0.18, '2025-11-30', 'Fridge F-1',
   'A-silicone VPS, light body wash for final impressions'),

  ('mat-00000000-0000-0000-0000-000000000009',
   'GC Fuji Rock EP Die Stone',
   'GC-FUJIROCK-EP-3KG',
   'cat-00000000-0000-0000-0000-000000000004',
   'sup-00000000-0000-0000-0000-000000000003',
   'kg', 9, 2, 22.00, NULL, 'Shelf C-1',
   'Type IV die stone, 3 kg bag, ivory'),

  -- Wax & Resin
  ('mat-00000000-0000-0000-0000-000000000010',
   'GC Pattern Resin LS',
   'GC-PATTERN-LS-100G',
   'cat-00000000-0000-0000-0000-000000000006',
   'sup-00000000-0000-0000-0000-000000000003',
   'g', 45, 20, 0.38, '2025-09-30', 'Cabinet B-4',
   'Low-shrinkage autopolymerising pattern resin'),

  ('mat-00000000-0000-0000-0000-000000000011',
   'Renfert Geo Hard Wax Pink',
   'REN-GEO-HARD-PINK',
   'cat-00000000-0000-0000-0000-000000000006',
   'sup-00000000-0000-0000-0000-000000000005',
   'g', 200, 50, 0.12, NULL, 'Shelf C-3',
   'Hard modelling wax for full-arch wax-ups'),

  -- Adhesives
  ('mat-00000000-0000-0000-0000-000000000012',
   'Ivoclar Variolink Esthetic DC Base',
   'IPS-VARIOL-EST-DC',
   'cat-00000000-0000-0000-0000-000000000005',
   'sup-00000000-0000-0000-0000-000000000001',
   'ml', 8, 2, 34.60, '2026-01-31', 'Fridge F-2',
   'Dual-cure resin cement for ceramic restorations'),

  -- Consumables
  ('mat-00000000-0000-0000-0000-000000000013',
   'Shofu Brownie Polishing Points (pack/12)',
   'SHO-BROWNIE-12PK',
   'cat-00000000-0000-0000-0000-000000000007',
   'sup-00000000-0000-0000-0000-000000000004',
   'pack', 8, 3, 9.20, NULL, 'Drawer P-1',
   'Pre-polishing rubber points for composite and ceramics'),

  ('mat-00000000-0000-0000-0000-000000000014',
   'Diamond Bur FG 856-016 (pack/5)',
   'BUR-FG-856-016-5PK',
   'cat-00000000-0000-0000-0000-000000000007',
   'sup-00000000-0000-0000-0000-000000000006',
   'pack', 6, 2, 14.50, NULL, 'Drawer P-2',
   'Flame-shaped coarse diamond burs for zirconia'),

  ('mat-00000000-0000-0000-0000-000000000015',
   'Disposable Mixing Tips Blue (bag/50)',
   'MIX-TIP-BLUE-50',
   'cat-00000000-0000-0000-0000-000000000007',
   'sup-00000000-0000-0000-0000-000000000006',
   'pack', 12, 4, 4.80, NULL, 'Drawer P-3',
   'Universal automix tips for VPS and polyether cartridges');


-- Stock movements (initial stock-in for all materials) ────────

INSERT INTO stock_movements
  (material_id, movement_type, quantity, unit_cost, reason, batch_number)
VALUES
  ('mat-00000000-0000-0000-0000-000000000001', 'in', 40, 18.50, 'Initial stock receive', 'PO-2024-001'),
  ('mat-00000000-0000-0000-0000-000000000002', 'in', 28, 18.50, 'Initial stock receive', 'PO-2024-001'),
  ('mat-00000000-0000-0000-0000-000000000003', 'in', 15, 44.00, 'Initial stock receive', 'PO-2024-001'),
  ('mat-00000000-0000-0000-0000-000000000004', 'in', 12,  6.80, 'Initial stock receive', 'PO-2024-002'),
  ('mat-00000000-0000-0000-0000-000000000005', 'in', 50,  5.20, 'Initial stock receive', 'PO-2024-002'),
  ('mat-00000000-0000-0000-0000-000000000006', 'in', 300, 0.92, 'Initial stock receive', 'PO-2024-003'),
  ('mat-00000000-0000-0000-0000-000000000007', 'in', 80, 58.40, 'Initial stock receive', 'PO-2024-003'),
  ('mat-00000000-0000-0000-0000-000000000008', 'in', 240, 0.18, 'Initial stock receive', 'PO-2024-004'),
  ('mat-00000000-0000-0000-0000-000000000009', 'in', 9,  22.00, 'Initial stock receive', 'PO-2024-004'),
  ('mat-00000000-0000-0000-0000-000000000010', 'in', 45,  0.38, 'Initial stock receive', 'PO-2024-005'),
  ('mat-00000000-0000-0000-0000-000000000011', 'in', 200, 0.12, 'Initial stock receive', 'PO-2024-005'),
  ('mat-00000000-0000-0000-0000-000000000012', 'in', 8,  34.60, 'Initial stock receive', 'PO-2024-006'),
  ('mat-00000000-0000-0000-0000-000000000013', 'in', 8,   9.20, 'Initial stock receive', 'PO-2024-006'),
  ('mat-00000000-0000-0000-0000-000000000014', 'in', 6,  14.50, 'Initial stock receive', 'PO-2024-007'),
  ('mat-00000000-0000-0000-0000-000000000015', 'in', 12,  4.80, 'Initial stock receive', 'PO-2024-007');


-- Cases ───────────────────────────────────────────────────────

INSERT INTO cases
  (id, case_code, patient_name, clinic_name, doctor_name,
   work_type, status, tooth_numbers, shade,
   received_date, due_date, completed_date,
   labor_cost, machine_cost, final_price, notes)
VALUES
  ('cas-00000000-0000-0000-0000-000000000001',
   'CASE-2024-0001', 'Maria Ionescu',      'Smile Clinic Chișinău', 'Dr. Andrei Popescu',
   'crown',    'delivered',  '11',       'A2',  '2024-09-02', '2024-09-09', '2024-09-08',
   45.00, 12.00, 180.00, 'Patient requested high translucency. Approved by doctor on fit-in.'),

  ('cas-00000000-0000-0000-0000-000000000002',
   'CASE-2024-0002', 'Ion Cojocaru',       'DentArt Balti',         'Dr. Elena Rusu',
   'bridge',   'completed',  '12, 13, 14','B1', '2024-09-05', '2024-09-15', '2024-09-14',
   110.00, 30.00, 520.00, '3-unit bridge upper left. Metal-ceramic. Extra try-in scheduled.'),

  ('cas-00000000-0000-0000-0000-000000000003',
   'CASE-2024-0003', 'Svetlana Moraru',    'Dent Total Orhei',      'Dr. Victor Florea',
   'veneer',   'in_progress','21, 22, 23','A1', '2024-09-10', '2024-09-20', NULL,
   75.00, 18.00, 390.00, 'Pressed e.max veneers, ultra-thin prep. Photo guide provided.'),

  ('cas-00000000-0000-0000-0000-000000000004',
   'CASE-2024-0004', 'Gheorghe Lungu',     'Smile Clinic Chișinău', 'Dr. Andrei Popescu',
   'implant_crown', 'awaiting_approval', '36', 'A3', '2024-09-12', '2024-09-22', NULL,
   55.00, 15.00, 230.00, 'Screw-retained zirconia crown on Straumann BL 4.1 implant.'),

  ('cas-00000000-0000-0000-0000-000000000005',
   'CASE-2024-0005', 'Tatiana Botnaru',    'Family Dent Cahul',     'Dr. Natalia Ciobanu',
   'denture_full', 'draft',      NULL,     NULL,  '2024-09-15', '2024-09-30', NULL,
   120.00, 25.00, 380.00, 'Full upper & lower denture. Shade pre-selected at clinic.'),

  ('cas-00000000-0000-0000-0000-000000000006',
   'CASE-2024-0006', 'Alexandru Vrabie',   'OrthoSmile Tiraspol',   'Dr. Inna Savchenko',
   'night_guard', 'completed',  NULL,     NULL,  '2024-09-03', '2024-09-07', '2024-09-06',
   20.00, 5.00, 90.00, 'Hard acrylic night guard, upper arch, 2mm thickness.'),

  ('cas-00000000-0000-0000-0000-000000000007',
   'CASE-2024-0007', 'Natalia Ghelase',    'Dent Total Orhei',      'Dr. Victor Florea',
   'inlay_onlay', 'in_progress', '15, 16', 'A2', '2024-09-13', '2024-09-18', NULL,
   60.00, 14.00, 280.00, 'Two e.max press inlays. Staining and glazing only, no layering.'),

  ('cas-00000000-0000-0000-0000-000000000008',
   'CASE-2024-0008', 'Dumitru Păduraru',   'DentArt Balti',         'Dr. Elena Rusu',
   'crown',    'cancelled',  '46',       'A3', '2024-09-01', '2024-09-08', NULL,
   0.00, 0.00, 0.00, 'Cancelled — patient changed treatment plan to implant.');


-- Case material usage ─────────────────────────────────────────
-- NOTE: These inserts trigger fn_auto_movement_on_case_usage
--       which writes corresponding stock_movements rows, and
--       fn_rollup_case_material_cost which updates cases.material_cost.

INSERT INTO case_material_usage
  (case_id, material_id, quantity_used, unit_cost_at_time, notes)
VALUES
  -- CASE-2024-0001: e.max crown (1 block, some stain)
  ('cas-00000000-0000-0000-0000-000000000001',
   'mat-00000000-0000-0000-0000-000000000001', 1,    18.50, 'A2 LT block for crown on 11'),
  ('cas-00000000-0000-0000-0000-000000000001',
   'mat-00000000-0000-0000-0000-000000000004', 0.50,  6.80, 'White essence for incisal'),
  ('cas-00000000-0000-0000-0000-000000000001',
   'mat-00000000-0000-0000-0000-000000000013', 0.25,  9.20, '3 polishing points used'),

  -- CASE-2024-0002: metal-ceramic bridge (alloy + ceramic)
  ('cas-00000000-0000-0000-0000-000000000002',
   'mat-00000000-0000-0000-0000-000000000006', 18.0,  0.92, 'Ni-Cr-Mo coping framework'),
  ('cas-00000000-0000-0000-0000-000000000002',
   'mat-00000000-0000-0000-0000-000000000005', 12.0,  5.20, 'Ceramage dentin layering'),
  ('cas-00000000-0000-0000-0000-000000000002',
   'mat-00000000-0000-0000-0000-000000000011', 15.0,  0.12, 'Wax-up material'),
  ('cas-00000000-0000-0000-0000-000000000002',
   'mat-00000000-0000-0000-0000-000000000014', 0.60, 14.50, '3 burs used during finishing'),

  -- CASE-2024-0003: 3x e.max veneers
  ('cas-00000000-0000-0000-0000-000000000003',
   'mat-00000000-0000-0000-0000-000000000002', 3,    18.50, '1 B1 HT block per veneer'),
  ('cas-00000000-0000-0000-0000-000000000003',
   'mat-00000000-0000-0000-0000-000000000004', 1.20,  6.80, 'Characterisation stain'),
  ('cas-00000000-0000-0000-0000-000000000003',
   'mat-00000000-0000-0000-0000-000000000012', 0.60, 34.60, 'Resin cement for 3 veneers'),

  -- CASE-2024-0004: zirconia implant crown
  ('cas-00000000-0000-0000-0000-000000000004',
   'mat-00000000-0000-0000-0000-000000000003', 1,    44.00, '98mm A2 multi-layer disc'),
  ('cas-00000000-0000-0000-0000-000000000004',
   'mat-00000000-0000-0000-0000-000000000014', 0.40, 14.50, '2 diamond burs for zirconia'),

  -- CASE-2024-0006: night guard (resin)
  ('cas-00000000-0000-0000-0000-000000000006',
   'mat-00000000-0000-0000-0000-000000000010', 8.0,   0.38, 'Pattern resin for thermoform'),
  ('cas-00000000-0000-0000-0000-000000000006',
   'mat-00000000-0000-0000-0000-000000000013', 0.25,  9.20, 'Post-polish'),

  -- CASE-2024-0007: 2x inlays
  ('cas-00000000-0000-0000-0000-000000000007',
   'mat-00000000-0000-0000-0000-000000000001', 2,    18.50, '1 block per inlay'),
  ('cas-00000000-0000-0000-0000-000000000007',
   'mat-00000000-0000-0000-0000-000000000004', 0.30,  6.80, 'Surface stain only'),
  ('cas-00000000-0000-0000-0000-000000000007',
   'mat-00000000-0000-0000-0000-000000000015', 0.10,  4.80, '5 mixing tips');
