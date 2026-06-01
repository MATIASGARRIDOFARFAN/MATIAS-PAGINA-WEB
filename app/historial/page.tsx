"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HISTORY_TYPE_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { clientApi } from "@/lib/client-api"

interface HistoryItem {
  id: string
  type: string
  status: string
  createdAt: string
  product: { id: string; title: string; image?: string } | null
  relatedUser: { id: string; name: string; avatar: string } | null
}

export default function HistorialPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientApi.history
      .list()
      .then((d) => setHistory(d.history ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthGuard>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold">Historial</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compras, ventas, préstamos, intercambios y solicitudes.
          </p>

          {loading ? (
            <div className="mt-8 h-40 animate-pulse rounded-xl bg-muted" />
          ) : history.length === 0 ? (
            <p className="mt-8 text-center text-muted-foreground">Aún no hay actividad registrada.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{HISTORY_TYPE_LABELS[item.type] ?? item.type}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    {item.product && (
                      <Link
                        href={`/producto/${item.product.id}`}
                        className="mt-1 block font-medium hover:text-primary"
                      >
                        {item.product.title}
                      </Link>
                    )}
                    {item.relatedUser && (
                      <p className="text-sm text-muted-foreground">Con: {item.relatedUser.name}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("es-PE")}
                  </time>
                </div>
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
