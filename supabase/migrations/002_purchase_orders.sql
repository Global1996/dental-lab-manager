-- ============================================================
-- MIGRATION 002: Purchase Orders
-- ============================================================
-- Two tables:
--   purchase_orders       — the order header (supplier, date, status, notes)
--   purchase_order_items  — line items (material, quantity, unit_cost)
--
-- When an order is marked "received", the application inserts
-- stock_movements rows explicitly (one per line item). The DB
-- itself does NOT do this automatically — it stays simple and
-- auditable. The server action handles it transactionally.
-- ============================================================

-- ─── Status ENUM ──────────────────────────────────────────────────────────────

CREATE TYPE po_status AS ENUM (
  'draft',      -- being assembled, not sent yet
  'ordered',    -- sent to supplier, awaiting delivery
  'received',   -- goods arrived, stock updated
  'cancelled'   -- abandoned
);

-- ─── purchase_orders ─────────────────────────────────────────────────────────

CREATE TABLE purchase_orders (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(50)  NOT NULL,           -- e.g. PO-2024-0001, set by app
  supplier_id     UUID         REFERENCES suppliers(id) ON DELETE SET NULL,
  status          po_status    NOT NULL DEFAULT 'draft',
  order_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  expected_date   DATE,                            -- optional delivery estimate
  received_date   DATE,                            -- filled in when status→received
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_po_order_number UNIQUE (order_number),
  CONSTRAINT chk_po_expected_after_order
    CHECK (expected_date IS NULL OR expected_date >= order_date),
  CONSTRAINT chk_po_received_after_order
    CHECK (received_date IS NULL OR received_date >= order_date)
);

CREATE INDEX idx_po_supplier    ON purchase_orders (supplier_id);
CREATE INDEX idx_po_status      ON purchase_orders (status);
CREATE INDEX idx_po_order_date  ON purchase_orders (order_date DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION fn_update_po_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_po_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fn_update_po_timestamp();

-- ─── purchase_order_items ─────────────────────────────────────────────────────

CREATE TABLE purchase_order_items (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id     UUID          REFERENCES materials(id) ON DELETE SET NULL,
  material_name   VARCHAR(200)  NOT NULL,    -- snapshot so name survives material deletion
  unit            VARCHAR(30)   NOT NULL,    -- snapshot of unit at time of order
  quantity_ordered NUMERIC(12,4) NOT NULL,
  unit_cost       NUMERIC(12,4),             -- optional — price negotiated with supplier
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_poi_quantity  CHECK (quantity_ordered > 0),
  CONSTRAINT chk_poi_unit_cost CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

CREATE INDEX idx_poi_order    ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_poi_material ON purchase_order_items (material_id);
