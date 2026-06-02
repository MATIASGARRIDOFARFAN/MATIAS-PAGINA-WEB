"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { type Product } from "@/lib/data"
import { Button } from "@/components/ui/button"

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold">Mis favoritos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Productos que guardaste. Te avisaremos si cambian de precio o vuelven a estar disponibles.
          </p>

          {loading ? (
            <div className="mt-8 h-40 animate-pulse rounded-xl bg-muted" />
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-border py-12 text-center">
              <p className="font-medium">No tienes favoritos guardados</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa el corazón en cualquier publicación para guardarla aquí.
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Explorar publicaciones</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
