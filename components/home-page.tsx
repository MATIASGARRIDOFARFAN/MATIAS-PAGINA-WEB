"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { Marketplace } from "@/components/marketplace"
import { clientApi } from "@/lib/client-api"
import type { Product } from "@/lib/data"

export function HomePage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientApi.products.list().then((list) => {
      setProducts(list)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground">Cargando productos…</div>
        ) : (
          <Marketplace products={products} query={q} />
        )}
      </main>
      <Footer />
    </div>
  )
}
