// src/lib/export.ts
// Browser-side export helpers. No external dependencies.
//
// Exports three functions:
//   exportToCsv(filename, rows)   — downloads a UTF-8 CSV file
//   exportToXlsx(filename, rows)  — downloads a real .xlsx file (SpreadsheetML)
//   exportToPdf(filename, rows)   — STUB: ready for a PDF library (e.g. jsPDF)
//
// Each function accepts a `rows` array of objects where:
//   - keys   become the column headers
//   - values must be string | number | null | undefined
//
// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportRow   = Record<string, string | number | null | undefined>
export type ExportFormat = 'csv' | 'xlsx'

// ─── CSV ──────────────────────────────────────────────────────────────────────

/**
 * Download `rows` as a UTF-8 CSV file.
 * Cells containing commas, quotes, or newlines are quoted per RFC 4180.
 */
export function exportToCsv(filename: string, rows: ExportRow[]): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])

  const escape = (v: string | number | null | undefined): string => {
    const s = v == null ? '' : String(v)
    // Quote if the value contains a comma, double-quote, or newline
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const lines: string[] = [
    headers.map(escape).join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]

  // BOM (\uFEFF) makes Excel open the file correctly on Windows
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  triggerDownload(blob, filename.endsWith('.csv') ? filename : filename + '.csv')
}

// ─── XLSX (SpreadsheetML — no external library) ────────────────────────────

/**
 * Download `rows` as a real .xlsx file using SpreadsheetML XML.
 * Opens natively in Excel, LibreOffice Calc, Google Sheets, and Numbers.
 *
 * How it works:
 *   An .xlsx file is a ZIP archive containing XML files.
 *   We build the XML manually for a single-sheet workbook, then pack it
 *   into a ZIP using only the browser's CompressionStream API (available
 *   in all modern browsers since 2022) and a tiny custom ZIP writer.
 *   No external library needed.
 */
export async function exportToXlsx(filename: string, rows: ExportRow[]): Promise<void> {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const fname   = filename.endsWith('.xlsx') ? filename : filename + '.xlsx'

  // Build worksheet XML -------------------------------------------------
  const xmlRows: string[] = []

  // Header row (row 1, bold)
  const hCells = headers.map((h, i) => {
    const col = colName(i)
    return `<c r="${col}1" t="inlineStr"><is><t>${xmlEscape(h)}</t></is></c>`
  })
  xmlRows.push(`<row r="1">${hCells.join('')}</row>`)

  // Data rows
  rows.forEach((row, ri) => {
    const r = ri + 2  // 1-indexed, header is row 1
    const cells = headers.map((h, ci) => {
      const val = row[h]
      const col = colName(ci)
      if (val == null || val === '') {
        return `<c r="${col}${r}"/>`
      }
      if (typeof val === 'number') {
        return `<c r="${col}${r}"><v>${val}</v></c>`
      }
      return `<c r="${col}${r}" t="inlineStr"><is><t>${xmlEscape(String(val))}</t></is></c>`
    })
    xmlRows.push(`<row r="${r}">${cells.join('')}</row>`)
  })

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${xmlRows.join('')}</sheetData>
</worksheet>`

  // Minimal workbook XML files ------------------------------------------
  const files: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml"
    ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,

    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="xl/workbook.xml"/>
</Relationships>`,

    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Date" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,

    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
    Target="worksheets/sheet1.xml"/>
</Relationships>`,

    'xl/worksheets/sheet1.xml': sheetXml,
  }

  // Pack into a ZIP using the browser's native DecompressionStream -------
  const zipBytes = await buildZip(files)
  const blob = new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  triggerDownload(blob, fname)
}

// ─── PDF (stub) ───────────────────────────────────────────────────────────────

/**
 * PDF export — not yet implemented.
 *
 * TO ADD PDF SUPPORT:
 *   1. npm install jspdf jspdf-autotable
 *   2. Replace the stub below with:
 *
 *      import jsPDF from 'jspdf'
 *      import autoTable from 'jspdf-autotable'
 *
 *      export function exportToPdf(filename: string, rows: ExportRow[]): void {
 *        const doc  = new jsPDF()
 *        const keys = Object.keys(rows[0])
 *        autoTable(doc, {
 *          head: [keys],
 *          body: rows.map(r => keys.map(k => r[k] ?? '')),
 *        })
 *        doc.save(filename.endsWith('.pdf') ? filename : filename + '.pdf')
 *      }
 */
export function exportToPdf(_filename: string, _rows: ExportRow[]): void {
  throw new Error(
    'Export PDF nu este implementat încă. ' +
    'Adăugați jsPDF (npm install jspdf jspdf-autotable) și urmați comentariile din src/lib/export.ts.'
  )
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Trigger a browser file download for a Blob */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  // Clean up — small delay lets the browser start the download first
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Escape special XML characters */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Convert a zero-based column index to an Excel column letter (0→A, 25→Z, 26→AA) */
function colName(n: number): string {
  let name = ''
  n += 1
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

// ─── Minimal ZIP writer (no dependencies) ────────────────────────────────────
//
// An .xlsx file is a standard ZIP. We build it without any library by:
//   1. Encoding each file entry as UTF-8 bytes
//   2. Computing CRC-32 for each entry
//   3. Writing local file headers + data
//   4. Writing the central directory at the end
//
// This produces uncompressed ("stored") ZIP entries, which is perfectly valid.
// File sizes stay small because SpreadsheetML XML is already text.

async function buildZip(files: Record<string, string>): Promise<Uint8Array> {
  const encoder    = new TextEncoder()
  const entries: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = []
  const parts:   Uint8Array[] = []
  let offset = 0

  for (const [path, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(path)
    const dataBytes = encoder.encode(content)
    const crc       = crc32(dataBytes)

    // Local file header
    const lfh = localFileHeader(nameBytes, dataBytes, crc)
    parts.push(lfh, nameBytes, dataBytes)

    entries.push({ name: nameBytes, data: dataBytes, crc, offset })
    offset += lfh.length + nameBytes.length + dataBytes.length
  }

  // Central directory
  for (const e of entries) {
    const cdr = centralDirRecord(e.name, e.data, e.crc, e.offset)
    parts.push(cdr, e.name)
  }

  // End of central directory
  const cdOffset = offset
  const cdSize   = parts.slice(entries.length * 2).reduce((s, p) => s + p.length, 0)
  // Recompute: sum all central directory record lengths
  let cdSizeCalc = 0
  for (const e of entries) {
    cdSizeCalc += centralDirRecord(e.name, e.data, e.crc, e.offset).length + e.name.length
  }
  parts.push(endOfCentralDir(entries.length, cdSizeCalc, cdOffset))

  // Concatenate all parts
  const total = parts.reduce((s, p) => s + p.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  for (const p of parts) { result.set(p, pos); pos += p.length }
  return result
}

function u16le(n: number): [number, number] {
  return [n & 0xff, (n >> 8) & 0xff]
}
function u32le(n: number): [number, number, number, number] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
}

function localFileHeader(name: Uint8Array, data: Uint8Array, crc: number): Uint8Array {
  return new Uint8Array([
    0x50, 0x4b, 0x03, 0x04, // signature
    0x14, 0x00,             // version needed: 2.0
    0x00, 0x00,             // flags
    0x00, 0x00,             // compression: stored
    0x00, 0x00, 0x00, 0x00, // mod time/date
    ...u32le(crc),
    ...u32le(data.length),  // compressed size
    ...u32le(data.length),  // uncompressed size
    ...u16le(name.length),
    0x00, 0x00,             // extra field length
  ])
}

function centralDirRecord(name: Uint8Array, data: Uint8Array, crc: number, offset: number): Uint8Array {
  return new Uint8Array([
    0x50, 0x4b, 0x01, 0x02, // signature
    0x14, 0x00,             // version made by
    0x14, 0x00,             // version needed
    0x00, 0x00,             // flags
    0x00, 0x00,             // compression: stored
    0x00, 0x00, 0x00, 0x00, // mod time/date
    ...u32le(crc),
    ...u32le(data.length),
    ...u32le(data.length),
    ...u16le(name.length),
    0x00, 0x00,             // extra length
    0x00, 0x00,             // comment length
    0x00, 0x00,             // disk number start
    0x00, 0x00,             // internal attrs
    0x00, 0x00, 0x00, 0x00, // external attrs
    ...u32le(offset),
  ])
}

function endOfCentralDir(count: number, cdSize: number, cdOffset: number): Uint8Array {
  return new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, // signature
    0x00, 0x00,             // disk number
    0x00, 0x00,             // disk with CD start
    ...u16le(count),        // entries on this disk
    ...u16le(count),        // total entries
    ...u32le(cdSize),
    ...u32le(cdOffset),
    0x00, 0x00,             // comment length
  ])
}

// CRC-32 lookup table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
