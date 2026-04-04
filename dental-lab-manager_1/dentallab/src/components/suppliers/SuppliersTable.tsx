'use client'
// src/components/suppliers/SuppliersTable.tsx
// Client component — search + table for the suppliers list page.

import { useState, useMemo } from 'react'
import { Truck, Mail, Phone, User, Package2 } from 'lucide-react'
import Link from 'next/link'
import { SearchInput }         from '@/components/ui/SearchInput'
import { EditSupplierDialog }  from './EditSupplierDialog'
import { DeleteSupplierButton } from './DeleteSupplierButton'
import type { Supplier } from '@/types'

// The list page also passes material counts so we can show them per supplier
export interface SupplierWithCount extends Supplier {
  material_count: number
}

interface Props {
  suppliers: SupplierWithCount[]
}

export function SuppliersTable({ suppliers }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.contact_name ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.phone ?? '').toLowerCase().includes(q)
    )
  }, [suppliers, search])

  return (
    <div className="space-y-4">

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Caută după nume, contact, email sau telefon…"
        className="max-w-sm"
      />

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length === suppliers.length
          ? `${suppliers.length} furnizor${suppliers.length !== 1 ? 'i' : ''}`
          : `${filtered.length} din ${suppliers.length} furnizori`}
        {search && ` care corespund „${search}"`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-16 text-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/40">
              <Truck className="w-7 h-7 opacity-40" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {search ? 'Niciun furnizor nu corespunde căutării' : 'Niciun furnizor înregistrat'}
              </p>
              <p className="text-xs mt-1">
                {search
                  ? 'Încercați un alt termen de căutare.'
                  : 'Adăugați primul furnizor folosind butonul de mai sus.'}
              </p>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-primary hover:underline"
              >
                Șterge căutarea
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {[
                    'Furnizor',
                    'Contact',
                    'Email',
                    'Telefon',
                    'Materiale',
                    'Observații',
                    'Acțiuni',
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                                 text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Supplier name */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center
                                        justify-center text-primary text-xs font-bold shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate">{s.name}</span>
                      </div>
                    </td>

                    {/* Contact name */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px]">
                      {s.contact_name ? (
                        <span className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 shrink-0" />
                          {s.contact_name}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      {s.email ? (
                        <a
                          href={`mailto:${s.email}`}
                          className="flex items-center gap-1.5 truncate hover:text-primary
                                     transition-colors"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          {s.email}
                        </Link>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {s.phone ? (
                        <a
                          href={`tel:${s.phone}`}
                          className="flex items-center gap-1.5 hover:text-primary
                                     transition-colors"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          {s.phone}
                        </Link>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    {/* Material count — links to materials filtered by this supplier */}
                    <td className="px-4 py-3">
                      {s.material_count > 0 ? (
                        <Link
                          href={`/materials?supplier=${s.id}`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                                     text-xs font-medium bg-primary/10 text-primary
                                     hover:bg-primary/20 transition-colors"
                        >
                          <Package2 className="w-3 h-3" />
                          {s.material_count} material{s.material_count !== 1 ? 'e' : ''}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">0 materiale</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                      <span className="block truncate text-xs" title={s.notes ?? ''}>
                        {s.notes ?? '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <EditSupplierDialog supplier={s} />
                        <DeleteSupplierButton
                          supplierId={s.id}
                          supplierName={s.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
