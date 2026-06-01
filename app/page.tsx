import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { Marketplace } from "@/components/marketplace"
import { getAllProducts } from "@/lib/products-db"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const products = await getAllProducts()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Marketplace products={products} query={q ?? ""} />
      </main>
      <Footer />
    </div>
  )
}
