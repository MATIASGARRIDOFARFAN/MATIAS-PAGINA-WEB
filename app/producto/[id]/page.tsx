import { ProductPageClient } from "@/components/product-page-client"
import { fetchProductIdsForStaticBuild } from "@/lib/products-client"

export async function generateStaticParams() {
  const ids = await fetchProductIdsForStaticBuild()
  if (ids.length === 0) return [{ id: "_" }]
  return ids.map((id) => ({ id }))
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "_") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-muted-foreground">
        No hay productos en la base de datos para pregenerar rutas. Agrega productos y vuelve a ejecutar build.
      </div>
    )
  }
  return <ProductPageClient id={id} />
}
