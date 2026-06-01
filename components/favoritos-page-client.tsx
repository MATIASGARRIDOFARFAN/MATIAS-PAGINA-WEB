"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { AuthGuard } from "@/components/auth-guard"
import { clientApi } from "@/lib/client-api"
import type { Product } from "@/lib/data"

export function FavoritosPageClient() {
  const [favs, setFavs] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientApi.auth.me().then(async ({ user }) => {
      if (!user) return
      const list = await clientApi.favorites.list(user.id)
      setFavs(list)
      setLoading(false)
    })
  }, [])

  return (
    <AuthGuard redirectTo="/login">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold">Mis favoritos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Productos que guardaste. Te avisaremos si cambian de precio o vuelven a estar disponibles.
            </p>
            {loading ? (
              <p className="mt-8 text-center text-muted-foreground">Cargando…</p>
            ) : favs.length === 0 ? (
              <p className="mt-8 text-center text-muted-foreground">Aún no tienes favoritos guardados.</p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {favs.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
