-- =============================================================
-- Dental Lab Inventory & Patient Cost Calculator
-- PostgreSQL Schema + Seed Data
-- =============================================================

-- =============================================================
-- EXTENSIONS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE movement_type AS ENUM (
  'in',           -- stock received from supplier
  'out',          -- used in a case (auto-deducted)
  'adjustment',   -- manual correction
  'return',       -- returned to supplier
  'expired',      -- written off as expired
  'damaged'       -- written off as damaged
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
  'implant',
  'denture_full',
  'denture_partial',
  'orthodontic',
  'inlay_onlay',
  'night_guard',
  'other'
);

CREATE TYPE unit_type AS ENUM (
  'ml', 'g', 'kg', 'mg',
  'piece', 'pack', 'box',
  'tube', 'syringe', 'vial'
);


-- =============================================================
-- TABLE: categories
-- Groups materials by type for filtering and reporting.
-- =============================================================

CREATE TABLE categories (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT          NOT NULL,
  description TEXT,
  color_hex   CHAR(7)       CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_categories_name UNIQUE (name)
);

COMMENT ON TABLE  categories            IS 'Material categories (ceramics, alloys, impression materials, etc.)';
COMMENT ON COLUMN categories.color_hex IS 'UI badge colour e.g. #3B82F6';


-- =============================================================
-- TABLE: suppliers
-- Vendor records linked to materials and stock receipts.
-- =============================================================

CREATE TABLE suppliers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  contact_name TEXT,
  email        TEXT        CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        TEXT,
  address      TEXT,
  website      TEXT,
  notes        TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_suppliers_name UNIQUE (name)
);

COMMENT ON TABLE suppliers IS 'Dental material vendors and distributors';


-- =============================================================
-- TABLE: materials
-- The product catalogue. One row per stockable item.
-- Current quantity is derived from stock_movements but also
-- maintained as a denormalized column for fast threshold checks.
-- =============================================================

CREATE TABLE materials (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  sku             TEXT,
  category_id     UUID        REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id     UUID        REFERENCES suppliers(id)  ON DELETE SET NULL,
  unit            unit_type   NOT NULL DEFAULT 'piece',
  quantity        NUMERIC(12,4) NOT NULL DEFAULT 0       CHECK (quantity >= 0),
  min_threshold   NUMERIC(12,4) NOT NULL DEFAULT 0       CHECK (min_threshold >= 0),
  cost_per_unit   NUMERIC(12,4) NOT NULL DEFAULT 0       CHECK (cost_per_unit >= 0),
  expiry_date     DATE,
  location        TEXT,       -- shelf / cabinet reference e.g. 'Shelf A3'
  notes           TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_materials_sku UNIQUE (sku),
  CONSTRAINT chk_expiry_future_or_null CHECK (expiry_date IS NULL OR expiry_date > '2000-01-01')
);

COMMENT ON TABLE  materials               IS 'Dental lab material catalogue with live stock quantity';
COMMENT ON COLUMN materials.quantity      IS 'Denormalised running total kept in sync by trigger on stock_movements';
COMMENT ON COLUMN materials.min_threshold IS 'Low-stock alert fires when quantity drops to or below this value';
COMMENT ON COLUMN materials.location      IS 'Physical storage location in the lab';


-- =============================================================
-- TABLE: stock_movements
-- Immutable audit log. Every quantity change is one row.
-- Inserting a row triggers an update to materials.quantity.
-- =============================================================

CREATE TABLE stock_movements (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id    UUID          NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  movement_type  movement_type NOT NULL,
  quantity       NUMERIC(12,4) NOT NULL CHECK (quantity > 0),
  unit_cost      NUMERIC(12,4)           CHECK (unit_cost IS NULL OR unit_cost >= 0),
  reason         TEXT,
  case_id        UUID,         -- FK added after cases table is created (see ALTER below)
  batch_number   TEXT,
  expiry_date    DATE,
  performed_by   TEXT,         -- free-text name; replace with UUID FK when users table exists
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  stock_movements              IS 'Append-only log of every stock quantity change';
COMMENT ON COLUMN stock_movements.quantity     IS 'Always positive; direction is implied by movement_type';
COMMENT ON COLUMN stock_movements.unit_cost    IS 'Purchase price snapshot for stock-in movements';
COMMENT ON COLUMN stock_movements.case_id      IS 'Set when movement_type = out and deduction is case-driven';


-- =============================================================
-- TABLE: cases
-- A work order for one patient. Costs roll up from case_material_usage.
-- material_cost is maintained automatically by trigger.
-- total_cost and profit are GENERATED columns.
-- =============================================================

CREATE TABLE cases (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_code       TEXT        NOT NULL,
  patient_name    TEXT        NOT NULL,
  clinic_name     TEXT,
  doctor_name     TEXT,
  work_type       work_type   NOT NULL DEFAULT 'other',
  status          case_status NOT NULL DEFAULT 'draft',
  tooth_numbers   TEXT[],                               -- e.g. ARRAY['11','12','21']
  shade           TEXT,                                 -- e.g. 'A2', 'B1'

  -- Dates
  received_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  completed_date  DATE,

  -- Cost components
  material_cost   NUMERIC(12,2) NOT NULL DEFAULT 0     CHECK (material_cost  >= 0),
  labor_cost      NUMERIC(12,2) NOT NULL DEFAULT 0     CHECK (labor_cost     >= 0),
  machine_cost    NUMERIC(12,2) NOT NULL DEFAULT 0     CHECK (machine_cost   >= 0),

  -- Derived (generated)
  total_cost      NUMERIC(12,2) GENERATED ALWAYS AS
                    (material_cost + labor_cost + machine_cost) STORED,

  final_price     NUMERIC(12,2) NOT NULL DEFAULT 0     CHECK (final_price    >= 0),

  profit          NUMERIC(12,2) GENERATED ALWAYS AS
                    (final_price - (material_cost + labor_cost + machine_cost)) STORED,

  profit_margin   NUMERIC(6,2) GENERATED ALWAYS AS (
                    CASE WHEN final_price > 0
                      THEN ROUND(
                        (final_price - (material_cost + labor_cost + machine_cost))
                        / final_price * 100, 2)
                      ELSE 0
                    END
                  ) STORED,

  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_cases_code      UNIQUE (case_code),
  CONSTRAINT chk_due_after_recv CHECK (due_date IS NULL OR due_date >= received_date),
  CONSTRAINT chk_completed_date CHECK (completed_date IS NULL OR completed_date >= received_date)
);

COMMENT ON TABLE  cases               IS 'Patient work orders with full cost and profit tracking';
COMMENT ON COLUMN cases.material_cost IS 'Auto-updated by trigger when case_material_usage changes';
COMMENT ON COLUMN cases.total_cost    IS 'Generated: material_cost + labor_cost + machine_cost';
COMMENT ON COLUMN cases.profit        IS 'Generated: final_price - total_cost';
COMMENT ON COLUMN cases.profit_margin IS 'Generated: profit / final_price * 100';


-- Add the case_id FK to stock_movements now that cases exists
ALTER TABLE stock_movements
  ADD CONSTRAINT fk_stock_movements_case
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;


-- =============================================================
-- TABLE: case_material_usage
-- One row per material used on a case.
-- unit_cost_at_time is a snapshot — immune to future price changes.
-- Inserting / deleting rows triggers material_cost rollup on cases
-- and auto-deducts stock via stock_movements.
-- =============================================================

CREATE TABLE case_material_usage (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id           UUID          NOT NULL REFERENCES cases(id)     ON DELETE CASCADE,
  material_id       UUID          NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity_used     NUMERIC(12,4) NOT NULL                          CHECK (quantity_used > 0),
  unit_cost_at_time NUMERIC(12,4) NOT NULL                          CHECK (unit_cost_at_time >= 0),
  total_cost        NUMERIC(12,4) GENERATED ALWAYS AS
                      (quantity_used * unit_cost_at_time) STORED,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  case_material_usage                  IS 'Materials consumed per case with cost snapshot';
COMMENT ON COLUMN case_material_usage.unit_cost_at_time IS 'Locked at insertion time; not a live FK to materials.cost_per_unit';
COMMENT ON COLUMN case_material_usage.total_cost        IS 'Generated: quantity_used * unit_cost_at_time';


-- =============================================================
-- INDEXES
-- =============================================================

-- materials
CREATE INDEX idx_materials_category    ON materials(category_id);
CREATE INDEX idx_materials_supplier    ON materials(supplier_id);
CREATE INDEX idx_materials_low_stock   ON materials(quantity, min_threshold) WHERE is_active = TRUE;
CREATE INDEX idx_materials_expiry      ON materials(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_materials_name        ON materials USING gin(to_tsvector('english', name));

-- stock_movements
CREATE INDEX idx_stock_mov_material    ON stock_movements(material_id);
CREATE INDEX idx_stock_mov_case        ON stock_movements(case_id)     WHERE case_id IS NOT NULL;
CREATE INDEX idx_stock_mov_type        ON stock_movements(movement_type);
CREATE INDEX idx_stock_mov_created     ON stock_movements(created_at DESC);

-- cases
CREATE INDEX idx_cases_status          ON cases(status);
CREATE INDEX idx_cases_work_type       ON cases(work_type);
CREATE INDEX idx_cases_received        ON cases(received_date DESC);
CREATE INDEX idx_cases_due             ON cases(due_date)          WHERE due_date IS NOT NULL;
CREATE INDEX idx_cases_patient         ON cases USING gin(to_tsvector('english', patient_name));

-- case_material_usage
CREATE INDEX idx_case_usage_case       ON case_material_usage(case_id);
CREATE INDEX idx_case_usage_material   ON case_material_usage(material_id);


-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

-- 1. Keep updated_at current on materials and cases ────────────

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- 2. Keep materials.quantity in sync with stock_movements ──────

CREATE OR REPLACE FUNCTION fn_sync_material_quantity()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_delta NUMERIC;
BEGIN
  -- Determine the signed delta
  CASE NEW.movement_type
    WHEN 'in'         THEN v_delta :=  NEW.quantity;
    WHEN 'return'     THEN v_delta :=  NEW.quantity;
    WHEN 'out'        THEN v_delta := -NEW.quantity;
    WHEN 'expired'    THEN v_delta := -NEW.quantity;
    WHEN 'damaged'    THEN v_delta := -NEW.quantity;
    WHEN 'adjustment' THEN v_delta :=  NEW.quantity; -- positive = top-up; for reductions caller inserts 'adjustment' with type 'out' instead
    ELSE v_delta := 0;
  END CASE;

  UPDATE materials
     SET quantity = GREATEST(0, quantity + v_delta)
   WHERE id = NEW.material_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_quantity
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_sync_material_quantity();


-- 3. Prevent stock going below zero ────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_stock_not_negative()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_current NUMERIC;
BEGIN
  IF NEW.movement_type IN ('out', 'expired', 'damaged') THEN
    SELECT quantity INTO v_current
      FROM materials
     WHERE id = NEW.material_id;

    IF v_current < NEW.quantity THEN
      RAISE EXCEPTION
        'Insufficient stock for material % (available: %, requested: %)',
        NEW.material_id, v_current, NEW.quantity
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_stock_negative
  BEFORE INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION fn_check_stock_not_negative();


-- 4. Auto-deduct stock and write movement when usage is recorded

CREATE OR REPLACE FUNCTION fn_deduct_stock_on_usage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO stock_movements
    (material_id, movement_type, quantity, unit_cost, reason, case_id)
  VALUES
    (NEW.material_id, 'out', NEW.quantity_used, NEW.unit_cost_at_time,
     'Case usage (auto)', NEW.case_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_stock_on_usage
  AFTER INSERT ON case_material_usage
  FOR EACH ROW EXECUTE FUNCTION fn_deduct_stock_on_usage();


-- 5. Roll up material_cost on cases when usage changes ─────────

CREATE OR REPLACE FUNCTION fn_rollup_material_cost()
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
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_rollup_material_cost
  AFTER INSERT OR UPDATE OR DELETE ON case_material_usage
  FOR EACH ROW EXECUTE FUNCTION fn_rollup_material_cost();


-- =============================================================
-- SEED DATA
-- =============================================================

-- Categories ──────────────────────────────────────────────────

INSERT INTO categories (id, name, description, color_hex) VALUES
  ('cat-00000000-0000-0000-0000-000000000001', 'Ceramics',             'Porcelain powders, feldspathic and zirconia materials',  '#3B82F6'),
  ('cat-00000000-0000-0000-0000-000000000002', 'Metal Alloys',         'Base and precious metal alloys for castings',             '#8B5CF6'),
  ('cat-00000000-0000-0000-0000-000000000003', 'Impression Materials', 'Polyvinyl siloxane, alginate and polyether materials',    '#10B981'),
  ('cat-00000000-0000-0000-0000-000000000004', 'Gypsum & Stone',       'Dental stones, investments and plasters',                 '#F59E0B'),
  ('cat-00000000-0000-0000-0000-000000000005', 'Wax',                  'Pattern wax, inlay wax and occlusal rims',                '#EF4444'),
  ('cat-00000000-0000-0000-0000-000000000006', 'Composites',           'Resin composites and bonding agents',                    '#06B6D4'),
  ('cat-00000000-0000-0000-0000-000000000007', 'Abrasives & Polishing','Burs, discs, polishing pastes and stones',               '#64748B'),
  ('cat-00000000-0000-0000-0000-000000000008', 'Consumables',          'Gloves, masks, mixing pads, plastic tools',              '#6B7280');


-- Suppliers ───────────────────────────────────────────────────

INSERT INTO suppliers (id, name, contact_name, email, phone, website) VALUES
  ('sup-00000000-0000-0000-0000-000000000001', 'Ivoclar Vivadent',   'James Holloway',  'orders@ivoclar.com',          '+1-800-533-6825', 'https://www.ivoclar.com'),
  ('sup-00000000-0000-0000-0000-000000000002', 'Dentsply Sirona',    'Maria Chen',      'dental.sales@dentsply.com',   '+1-800-877-0020', 'https://www.dentsplysirona.com'),
  ('sup-00000000-0000-0000-0000-000000000003', 'GC Corporation',     'Kenji Nakamura',  'info@gcamerica.com',          '+1-800-323-7063', 'https://www.gcamerica.com'),
  ('sup-00000000-0000-0000-0000-000000000004', 'Shofu Dental',       'Patricia Owens',  'info@shofu.com',              '+1-800-827-4638', 'https://www.shofu.com'),
  ('sup-00000000-0000-0000-0000-000000000005', 'Whip Mix',           'Robert Davila',   'custserv@whipmix.com',        '+1-800-626-5651', 'https://www.whipmix.com'),
  ('sup-00000000-0000-0000-0000-000000000006', 'Jensen Dental',      'Susan Blake',     'info@jensendental.com',       '+1-888-536-7632', 'https://www.jensendental.com');


-- Materials ───────────────────────────────────────────────────
-- Columns: id, name, sku, category_id, supplier_id, unit,
--          quantity, min_threshold, cost_per_unit,
--          expiry_date, location, notes

INSERT INTO materials
  (id, name, sku, category_id, supplier_id, unit, quantity, min_threshold, cost_per_unit, expiry_date, location, notes)
VALUES

  -- Ceramics
  ('mat-0000000000000000000000000000000001',
   'IPS e.max CAD Block A2 LT C14',
   'IPS-EMAXCAD-A2LT-C14',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'piece', 42, 10, 18.50,
   NULL, 'Shelf B2', 'Lithium disilicate CAD/CAM block, shade A2, low translucency'),

  ('mat-0000000000000000000000000000000002',
   'IPS e.max CAD Block B1 HT C14',
   'IPS-EMAXCAD-B1HT-C14',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'piece', 28, 10, 18.50,
   NULL, 'Shelf B2', 'Lithium disilicate block, shade B1, high translucency'),

  ('mat-0000000000000000000000000000000003',
   'Zirconia Disc 98mm A2 Multi',
   'ZIRC-98-A2-MULTI',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000002',
   'piece', 14, 5, 48.00,
   NULL, 'Shelf B1', 'Multi-layered zirconia milling disc 98 × 14 mm'),

  ('mat-0000000000000000000000000000000004',
   'IPS Ivocolor Glaze Paste',
   'IPS-IVOCOLOR-GLAZE',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'g', 12, 5, 4.80,
   '2026-03-31', 'Fridge F1', 'Fluorescent glaze for IPS e.max restorations'),

  ('mat-0000000000000000000000000000000005',
   'Shofu Ceramage Dentin A2',
   'SHO-CERAMAGE-DEN-A2',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000004',
   'g', 30, 8, 6.20,
   '2026-09-15', 'Shelf B3', 'Supranano filled composite ceramic dentin paste'),

  -- Metal Alloys
  ('mat-0000000000000000000000000000000006',
   'Degudent U Metal Alloy',
   'DEG-U-ALLOY-100G',
   'cat-00000000-0000-0000-0000-000000000002',
   'sup-00000000-0000-0000-0000-000000000002',
   'g', 220, 50, 8.90,
   NULL, 'Safe S1', 'Universal precious metal alloy for PFM and full-cast crowns'),

  ('mat-0000000000000000000000000000000007',
   'Wirobond C+ Co-Cr Alloy',
   'WIRO-CPLUS-ALLOY',
   'cat-00000000-0000-0000-0000-000000000002',
   'sup-00000000-0000-0000-0000-000000000002',
   'g', 350, 100, 0.48,
   NULL, 'Safe S1', 'Cobalt-chromium base metal alloy for frameworks'),

  -- Impression Materials
  ('mat-0000000000000000000000000000000008',
   'Aquasil Ultra+ Heavy Body',
   'DENT-AQUASIL-HVY',
   'cat-00000000-0000-0000-0000-000000000003',
   'sup-00000000-0000-0000-0000-000000000002',
   'piece', 18, 5, 22.40,
   '2026-06-30', 'Shelf C1', 'VPS heavy body impression material, 50 ml cartridge'),

  ('mat-0000000000000000000000000000000009',
   'Aquasil Ultra+ Light Body',
   'DENT-AQUASIL-LITE',
   'cat-00000000-0000-0000-0000-000000000003',
   'sup-00000000-0000-0000-0000-000000000002',
   'piece', 22, 5, 19.80,
   '2026-06-30', 'Shelf C1', 'VPS light body wash material, 50 ml cartridge'),

  -- Gypsum & Stone
  ('mat-0000000000000000000000000000000010',
   'GC Fujirock EP Stone Yellow',
   'GC-FUJIROCK-EP-4KG',
   'cat-00000000-0000-0000-0000-000000000004',
   'sup-00000000-0000-0000-0000-000000000003',
   'kg', 8, 2, 24.00,
   NULL, 'Shelf D1', 'Type IV die stone, exceptional hardness and accuracy'),

  ('mat-0000000000000000000000000000000011',
   'Whip Mix Speedstone Blue',
   'WM-SPEEDSTONE-4KG',
   'cat-00000000-0000-0000-0000-000000000004',
   'sup-00000000-0000-0000-0000-000000000005',
   'kg', 12, 3, 18.50,
   NULL, 'Shelf D1', 'Fast-set Type III plaster for articulator mounting'),

  ('mat-0000000000000000000000000000000012',
   'Whip Mix Ceramivest Investment',
   'WM-CERAMIVEST-10KG',
   'cat-00000000-0000-0000-0000-000000000004',
   'sup-00000000-0000-0000-0000-000000000005',
   'kg', 5, 2, 32.00,
   NULL, 'Shelf D2', 'Phosphate-bonded investment for all-ceramic pressing'),

  -- Wax
  ('mat-0000000000000000000000000000000013',
   'Renfert GEO Classic Wax Blue',
   'REN-GEO-WAX-250G',
   'cat-00000000-0000-0000-0000-000000000005',
   'sup-00000000-0000-0000-0000-000000000006',
   'g', 480, 100, 0.12,
   NULL, 'Shelf E1', 'Modelling wax for pattern fabrication, medium hard'),

  ('mat-0000000000000000000000000000000014',
   'Ivoclar IQ Press Ingot A2 LT',
   'IPS-IQPRESS-A2LT',
   'cat-00000000-0000-0000-0000-000000000001',
   'sup-00000000-0000-0000-0000-000000000001',
   'piece', 3, 5, 32.00,
   '2027-01-31', 'Fridge F1', 'Lithium disilicate press ceramic ingot, 5-pack equivalent stored as singles'),

  -- Composites / Resin
  ('mat-0000000000000000000000000000000015',
   'GC Pattern Resin LS Powder',
   'GC-PATRES-LS-100G',
   'cat-00000000-0000-0000-0000-000000000006',
   'sup-00000000-0000-0000-0000-000000000003',
   'g', 60, 20, 0.42,
   '2026-01-15', 'Shelf C2', 'Low-shrinkage autopolymerising resin for pattern making'),

  ('mat-0000000000000000000000000000000016',
   'GC Pattern Resin LS Liquid',
   'GC-PATRES-LS-LIQ',
   'cat-00000000-0000-0000-0000-000000000006',
   'sup-00000000-0000-0000-0000-000000000003',
   'ml', 45, 15, 0.38,
   '2026-01-15', 'Shelf C2', 'Matching liquid for GC Pattern Resin LS powder'),

  -- Abrasives
  ('mat-0000000000000000000000000000000017',
   'Shofu Dura-Green Stone TC-2',
   'SHO-DURAGREEN-TC2',
   'cat-00000000-0000-0000-0000-000000000007',
   'sup-00000000-0000-0000-0000-000000000004',
   'piece', 45, 12, 1.20,
   NULL, 'Shelf A1', 'Green silicon carbide stone for porcelain adjustment, TC shank'),

  ('mat-0000000000000000000000000000000018',
   'Shofu Dialite LD Polishing Kit',
   'SHO-DIALITE-LD-KIT',
   'cat-00000000-0000-0000-0000-000000000007',
   'sup-00000000-0000-0000-0000-000000000004',
   'piece', 8, 3, 28.00,
   NULL, 'Shelf A2', 'Polishing system for lithium disilicate, 6-step kit'),

  -- Consumables
  ('mat-0000000000000000000000000000000019',
   'Nitrile Gloves Medium Box',
   'CONS-GLOVE-MED-100',
   'cat-00000000-0000-0000-0000-000000000008',
   'sup-00000000-0000-0000-0000-000000000006',
   'box', 6, 2, 12.50,
   NULL, 'Shelf A4', 'Powder-free nitrile examination gloves, 100/box'),

  ('mat-0000000000000000000000000000000020',
   'Autoclavable Mixing Bowls Small',
   'CONS-BOWL-SM-PKG',
   'cat-00000000-0000-0000-0000-000000000008',
   'sup-00000000-0000-0000-0000-000000000006',
   'piece', 24, 10, 1.80,
   NULL, 'Shelf A5', 'Flexible rubber mixing bowls, 200 ml');


-- Stock Movements (initial stock-in entries) ──────────────────

INSERT INTO stock_movements
  (material_id, movement_type, quantity, unit_cost, reason, performed_by)
VALUES
  ('mat-0000000000000000000000000000000001', 'in', 42, 18.50, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000002', 'in', 28, 18.50, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000003', 'in', 14, 48.00, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000004', 'in', 12,  4.80, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000005', 'in', 30,  6.20, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000006', 'in',220,  8.90, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000007', 'in',350,  0.48, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000008', 'in', 18, 22.40, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000009', 'in', 22, 19.80, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000010', 'in',  8, 24.00, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000011', 'in', 12, 18.50, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000012', 'in',  5, 32.00, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000013', 'in',480,  0.12, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000014', 'in',  3, 32.00, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000015', 'in', 60,  0.42, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000016', 'in', 45,  0.38, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000017', 'in', 45,  1.20, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000018', 'in',  8, 28.00, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000019', 'in',  6, 12.50, 'Initial stock',      'Warehouse'),
  ('mat-0000000000000000000000000000000020', 'in', 24,  1.80, 'Initial stock',      'Warehouse');


-- Cases ───────────────────────────────────────────────────────

INSERT INTO cases
  (id, case_code, patient_name, clinic_name, doctor_name, work_type,
   status, tooth_numbers, shade, received_date, due_date, completed_date,
   labor_cost, machine_cost, final_price, notes)
VALUES

  ('cas-00000000000000000000000000000001',
   'CASE-2024-0001', 'Emma Hartley',   'Riverside Dental',   'Dr. A. Patel',
   'crown',          'delivered',      ARRAY['26'],          'A2',
   '2024-10-01', '2024-10-08', '2024-10-07',
   45.00, 12.00, 280.00,
   'Full porcelain crown on upper left first molar, IPS e.max pressed'),

  ('cas-00000000000000000000000000000002',
   'CASE-2024-0002', 'Carlos Mendes',  'Bright Smile Clinic','Dr. S. Nguyen',
   'bridge',         'completed',      ARRAY['14','15','16'],'B1',
   '2024-10-05', '2024-10-18', '2024-10-17',
   120.00, 25.00, 890.00,
   '3-unit PFM bridge; patient allergic to nickel — Degudent U alloy specified'),

  ('cas-00000000000000000000000000000003',
   'CASE-2024-0003', 'Sophie Laurent', 'Centre Dentaire Laval','Dr. C. Tremblay',
   'veneer',         'in_progress',    ARRAY['11','12','13','21','22','23'],'A1',
   '2024-10-10', '2024-10-22', NULL,
   180.00, 30.00, 1400.00,
   '6 upper anterior veneers — minimal prep, IPS e.max CAD HT blocks'),

  ('cas-00000000000000000000000000000004',
   'CASE-2024-0004', 'James Okafor',   'Downtown Oral Care', 'Dr. B. Kim',
   'denture_full',   'draft',          NULL, NULL,
   '2024-10-12', '2024-11-01', NULL,
   200.00, 15.00, 1200.00,
   'Complete upper and lower denture — pink acrylic; impression phase pending'),

  ('cas-00000000000000000000000000000005',
   'CASE-2024-0005', 'Nina Bergström', 'Nordic Dental',      'Dr. E. Lindqvist',
   'implant',        'in_progress',    ARRAY['36'],          'A3',
   '2024-10-14', '2024-10-28', NULL,
   60.00, 18.00, 420.00,
   'Implant-supported zirconia crown; screw-retained; Neodent NP platform'),

  ('cas-00000000000000000000000000000006',
   'CASE-2024-0006', 'David Farquhar', 'Greenfield Family Dental','Dr. R. Santos',
   'inlay_onlay',    'awaiting_approval',ARRAY['46'],'A2',
   '2024-10-15', '2024-10-21', NULL,
   35.00, 8.00, 220.00,
   'MOD onlay IPS e.max CAD — patient approved shade at try-in; awaiting sign-off');


-- Case Material Usage ─────────────────────────────────────────
-- Inserting these rows will automatically:
--   1. Deduct stock via trg_deduct_stock_on_usage
--   2. Roll up cases.material_cost via trg_rollup_material_cost

INSERT INTO case_material_usage
  (case_id, material_id, quantity_used, unit_cost_at_time, notes)
VALUES

  -- CASE-2024-0001: e.max pressed crown
  ('cas-00000000000000000000000000000001', 'mat-0000000000000000000000000000000014', 1,   32.00, 'IQ Press ingot A2 LT'),
  ('cas-00000000000000000000000000000001', 'mat-0000000000000000000000000000000012', 0.2, 32.00, 'Ceramivest investment'),
  ('cas-00000000000000000000000000000001', 'mat-0000000000000000000000000000000004', 2,    4.80, 'Glaze paste final fire'),
  ('cas-00000000000000000000000000000001', 'mat-0000000000000000000000000000000013', 5,    0.12, 'Pattern wax'),
  ('cas-00000000000000000000000000000001', 'mat-0000000000000000000000000000000017', 2,    1.20, 'Porcelain adjustment stones'),

  -- CASE-2024-0002: PFM bridge
  ('cas-00000000000000000000000000000002', 'mat-0000000000000000000000000000000006', 12,   8.90, 'Degudent U alloy for framework'),
  ('cas-00000000000000000000000000000002', 'mat-0000000000000000000000000000000005', 4,    6.20, 'Ceramage dentin layering'),
  ('cas-00000000000000000000000000000002', 'mat-0000000000000000000000000000000010', 0.4, 24.00, 'Die stone for model'),
  ('cas-00000000000000000000000000000002', 'mat-0000000000000000000000000000000011', 0.3, 18.50, 'Mountin stone'),
  ('cas-00000000000000000000000000000002', 'mat-0000000000000000000000000000000017', 3,    1.20, 'Porcelain finishing stones'),

  -- CASE-2024-0003: 6 veneers
  ('cas-00000000000000000000000000000003', 'mat-0000000000000000000000000000000002', 6,   18.50, '6 × IPS e.max CAD B1 HT blocks'),
  ('cas-00000000000000000000000000000003', 'mat-0000000000000000000000000000000004', 3,    4.80, 'Glaze and stain'),
  ('cas-00000000000000000000000000000003', 'mat-0000000000000000000000000000000018', 1,   28.00, 'Dialite LD polishing kit'),
  ('cas-00000000000000000000000000000003', 'mat-0000000000000000000000000000000010', 0.6, 24.00, 'Die stone'),

  -- CASE-2024-0005: implant crown
  ('cas-00000000000000000000000000000005', 'mat-0000000000000000000000000000000003', 1,   48.00, 'Zirconia disc for milling'),
  ('cas-00000000000000000000000000000005', 'mat-0000000000000000000000000000000004', 1.5,  4.80, 'Glaze'),
  ('cas-00000000000000000000000000000005', 'mat-0000000000000000000000000000000010', 0.3, 24.00, 'Die stone'),

  -- CASE-2024-0006: onlay
  ('cas-00000000000000000000000000000006', 'mat-0000000000000000000000000000000001', 1,   18.50, 'IPS e.max CAD A2 LT block'),
  ('cas-00000000000000000000000000000006', 'mat-0000000000000000000000000000000004', 0.5,  4.80, 'Glaze'),
  ('cas-00000000000000000000000000000006', 'mat-0000000000000000000000000000000017', 1,    1.20, 'Finishing stone');
