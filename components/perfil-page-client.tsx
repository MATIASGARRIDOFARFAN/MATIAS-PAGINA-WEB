"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileContent } from "@/components/profile-content"
import { AuthGuard } from "@/components/auth-guard"
import { clientApi } from "@/lib/client-api"
import type { Product } from "@/lib/data"

export function PerfilPageClient() {
  const [payload, setPayload] = useState<{
    user: Parameters<typeof ProfileContent>[0]["user"]
    products: Product[]
    stats: { views: number; listings: number; favorites: number }
  } | null>(null)

  useEffect(() => {
    clientApi.profile.get().then((data) => {
      if ("error" in data && data.error) return
      setPayload(data as typeof payload)
    })
  }, [])

  return (
    <AuthGuard redirectTo="/login">
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            {!payload ? (
              <div className="py-16 text-center text-muted-foreground">Cargando perfil…</div>
            ) : (
              <ProfileContent
                user={payload.user}
                initialProducts={payload.products}
                stats={payload.stats}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  )
}
