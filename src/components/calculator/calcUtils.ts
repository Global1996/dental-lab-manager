// src/components/calculator/calcUtils.ts
// Pure calculation helpers for the cost calculator.
// These functions have no side effects and can be unit-tested independently.
// They are used by both the client components (for live preview) and
// the server actions (to double-check before persisting).

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MaterialLine {
  material_id:       string
  name:              string
  sku:               string | null
  unit:              string
  quantity_used:     number
  unit_cost_at_time: number   // snapshot
  available_qty:     number   // current stock — for validation only
  notes:             string | null
}

export interface CostSummary {
  material_cost:   number   // sum of all line totals
  labor_cost:      number
  machine_cost:    number
  total_cost:      number   // material + labor + machine
  final_price:     number
  estimated_profit:number   // final_price - total_cost
  profit_margin:   number   // percentage (0-100); 0 if final_price === 0
}

// ─── Line calculation ─────────────────────────────────────────────────────────

/** Cost for a single material line. */
export function calcLineCost(qty: number, unitCost: number): number {
  return roundCurrency(qty * unitCost)
}

// ─── Summary calculation ──────────────────────────────────────────────────────

/** Re-compute all case totals from the current set of material lines + manual costs. */
export function calcCostSummary(
  lines:       MaterialLine[],
  laborCost:   number,
  machineCost: number,
  finalPrice:  number
): CostSummary {
  const material_cost = roundCurrency(
    lines.reduce((sum, l) => sum + calcLineCost(l.quantity_used, l.unit_cost_at_time), 0)
  )
  const total_cost        = roundCurrency(material_cost + laborCost + machineCost)
  const estimated_profit  = roundCurrency(finalPrice - total_cost)
  const profit_margin     = finalPrice > 0
    ? roundPct((estimated_profit / finalPrice) * 100)
    : 0

  return {
    material_cost,
    labor_cost:      roundCurrency(laborCost),
    machine_cost:    roundCurrency(machineCost),
    total_cost,
    final_price:     roundCurrency(finalPrice),
    estimated_profit,
    profit_margin,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface StockValidationError {
  material_id:    string
  material_name:  string
  requested:      number
  available:      number
  unit:           string
}

/**
 * Returns a list of lines where requested qty exceeds available stock.
 * Empty array = all lines are valid.
 */
export function validateStock(lines: MaterialLine[]): StockValidationError[] {
  return lines
    .filter(l => l.quantity_used > l.available_qty)
    .map(l => ({
      material_id:   l.material_id,
      material_name: l.name,
      requested:     l.quantity_used,
      available:     l.available_qty,
      unit:          l.unit,
    }))
}

/** Returns true if the line is valid to save (qty > 0 and sufficient stock). */
export function isLineValid(line: Partial<MaterialLine>): boolean {
  if (!line.material_id) return false
  if (!line.quantity_used || line.quantity_used <= 0) return false
  if (line.available_qty !== undefined && line.quantity_used > line.available_qty) return false
  return true
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function roundCurrency(v: number): number {
  return Math.round(v * 100) / 100
}

function roundPct(v: number): number {
  return Math.round(v * 100) / 100
}

/** Format a number as currency string (no locale dependency). */
export function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/** Profit margin color class. */
export function profitColor(margin: number): string {
  if (margin >= 30) return 'text-emerald-600'
  if (margin >= 10) return 'text-amber-600'
  return 'text-red-600'
}
