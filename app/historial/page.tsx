"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HISTORY_TYPE_LABELS } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface HistoryItem {
  id: string
  type: string
  status: string
  title?: string | null
  createdAt: string
  product: { id: string; title: string; image?: string } | null
  relatedUser: { id: string; name: string; avatar: string } | null
  chatHref?: string | null
}

export default function HistorialPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
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
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{HISTORY_TYPE_LABELS[item.type] ?? item.type}</Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    {item.title && (
                      <p className="mt-1 text-sm font-medium">{item.title}</p>
                    )}
                    {item.product && (
                      <Link
                        href={`/producto/${item.product.id}`}
                        className="mt-1 block font-medium hover:text-primary"
                      >
                        {item.product.title}
                      </Link>
                    )}
                    {item.relatedUser ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Solicitante:{" "}
                        <Link
                          href={`/usuario/${item.relatedUser.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {item.relatedUser.name}
                        </Link>
                      </p>
                    ) : item.type === "request_received" || item.type === "solicitud_recibida" ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Solicitante no identificado en este registro
                      </p>
                    ) : null}
                    {item.chatHref && (
                      <Button asChild size="sm" variant="secondary" className="mt-2 gap-1.5">
                        <Link href={item.chatHref}>
                          <MessageCircle className="size-4" />
                          Ir al chat
                        </Link>
                      </Button>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
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
  )
}
