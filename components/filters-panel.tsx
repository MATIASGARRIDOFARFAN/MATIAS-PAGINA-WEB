"use client"

import { faculties, type Condition, type TransactionType } from "@/lib/data"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface Filters {
  faculty: string
  career: string
  conditions: Condition[]
  transactions: TransactionType[]
  maxPrice: number | null
}

export const defaultFilters: Filters = {
  faculty: "all",
  career: "all",
  conditions: [],
  transactions: [],
  maxPrice: null,
}

const conditionOptions: { id: Condition; label: string }[] = [
  { id: "nuevo", label: "Nuevo" },
  { id: "seminuevo", label: "Seminuevo" },
  { id: "usado", label: "Usado" },
]

const transactionOptions: { id: TransactionType; label: string }[] = [
  { id: "venta", label: "Venta" },
  { id: "intercambio", label: "Intercambio" },
  { id: "ambos", label: "Venta o intercambio" },
]

export function FiltersPanel({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const careers = faculties.find((f) => f.id === filters.faculty)?.careers ?? []

  function toggle<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filtros</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
          onClick={() => onChange(defaultFilters)}
        >
          Limpiar
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Facultad</Label>
        <Select
          value={filters.faculty}
          onValueChange={(v) => onChange({ ...filters, faculty: v, career: "all" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las facultades</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Carrera</Label>
        <Select
          value={filters.career}
          onValueChange={(v) => onChange({ ...filters, career: v })}
          disabled={filters.faculty === "all"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las carreras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las carreras</SelectItem>
            {careers.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Estado</Label>
        {conditionOptions.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={filters.conditions.includes(o.id)}
              onCheckedChange={() => onChange({ ...filters, conditions: toggle(filters.conditions, o.id) })}
            />
            {o.label}
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Tipo de transacción</Label>
        {transactionOptions.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={filters.transactions.includes(o.id)}
              onCheckedChange={() => onChange({ ...filters, transactions: toggle(filters.transactions, o.id) })}
            />
            {o.label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Precio máximo</Label>
        <Select
          value={filters.maxPrice?.toString() ?? "all"}
          onValueChange={(v) => onChange({ ...filters, maxPrice: v === "all" ? null : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sin límite</SelectItem>
            <SelectItem value="50">Hasta S/ 50</SelectItem>
            <SelectItem value="100">Hasta S/ 100</SelectItem>
            <SelectItem value="500">Hasta S/ 500</SelectItem>
            <SelectItem value="1500">Hasta S/ 1500</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
