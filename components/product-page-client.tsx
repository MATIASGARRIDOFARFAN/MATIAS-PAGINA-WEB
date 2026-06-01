"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductDetail } from "@/components/product-detail"
import { RelatedProducts } from "@/components/related-products"
import { clientApi } from "@/lib/client-api"
import { fetchRelatedProductsClient } from "@/lib/products-client"
import type { Product } from "@/lib/data"

export function ProductPageClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientApi.products.get(id).then(async (p) => {
      setProduct(p)
      if (p) setRelated(await fetchRelatedProductsClient(p))
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center text-muted-foreground">Cargando…</main>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">Producto no encontrado</main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ProductDetail product={product} />
        <RelatedProducts current={product} products={related} />
      </main>
      <Footer />
    </div>
  )
}
