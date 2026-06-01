import { type Product } from "@/lib/data"
import { ProductCard } from "@/components/product-card"

export function RelatedProducts({ current, products: related }: { current: Product; products: Product[] }) {

  if (related.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="mb-4 text-lg font-semibold">Productos relacionados con {current.career}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {related.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
