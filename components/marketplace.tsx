"use client"

import { useMemo, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { type Product } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { CategoryPills } from "@/components/category-pills"
import { FiltersPanel, defaultFilters, type Filters } from "@/components/filters-panel"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function Marketplace({ products, query = "" }: { products: Product[]; query?: string }) {
  const [category, setCategory] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [sort, setSort] = useState("recent")

  const results = useMemo(() => {
    let list = products.filter((p) => {
      if (category && p.category !== category) return false
      if (filters.career !== "all" && p.career !== filters.career) return false
      if (filters.conditions.length && !filters.conditions.includes(p.condition)) return false
      if (filters.transactions.length && !filters.transactions.includes(p.transaction)) return false
      if (filters.maxPrice !== null && p.price > filters.maxPrice) return false
      if (query) {
        const q = query.toLowerCase()
        const haystack = `${p.title} ${p.description} ${p.course} ${p.career} ${p.faculty} ${p.category}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price
      if (sort === "price-desc") return b.price - a.price
      if (sort === "popular") return b.views - a.views
      return b.createdAt.localeCompare(a.createdAt)
    })
    return list
  }, [category, filters, sort, query, products])

  return (
    <section id="resultados" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <CategoryPills active={category} onSelect={setCategory} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
            <FiltersPanel filters={filters} onChange={setFilters} />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {query ? `Resultados para "${query}"` : "Productos disponibles"}
              </h2>
              <p className="text-sm text-muted-foreground">{results.length} publicaciones</p>
            </div>

            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                    <SlidersHorizontal className="size-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <FiltersPanel filters={filters} onChange={setFilters} />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más reciente</SelectItem>
                  <SelectItem value="popular">Más popular</SelectItem>
                  <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="font-medium">No se encontraron productos</p>
              <p className="mt-1 text-sm text-muted-foreground">Prueba ajustando los filtros o la búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
