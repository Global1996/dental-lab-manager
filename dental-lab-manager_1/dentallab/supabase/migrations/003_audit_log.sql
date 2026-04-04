-- ============================================================
-- MIGRATION 003: Audit Log
-- ============================================================
-- Single table recording who did what and when.
-- Written to explicitly by server actions — no triggers.
-- Designed to be simple and readable, not exhaustive.
-- ============================================================

CREATE TABLE audit_logs (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Who did it (user_name is a snapshot — survives profile deletion)
  user_id      UUID         REFERENCES profiles(id) ON DELETE SET NULL,
  user_name    TEXT         NOT NULL DEFAULT 'Unknown',

  -- What type of action
  action       TEXT         NOT NULL,  -- 'create' | 'update' | 'delete' | 'stock_in' | 'stock_out' | 'adjustment'

  -- What was affected
  entity_type  TEXT         NOT NULL,  -- 'material' | 'case' | 'stock_movement'
  entity_id    TEXT,                   -- UUID of the affected record (nullable if deleted)
  entity_label TEXT,                   -- human-readable name snapshot e.g. "IPS e.max CAD Block"

  -- Human-readable summary of the change
  details      TEXT
);

CREATE INDEX idx_audit_created_at   ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_user_id      ON audit_logs (user_id);
CREATE INDEX idx_audit_entity_type  ON audit_logs (entity_type);
