"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, Eye, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { type Product, conditionLabels, transactionLabels } from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { clientApi } from "@/lib/client-api"

export function ProductCard({ product }: { product: Product }) {
  const [fav, setFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    clientApi.favorites
      .check(product.id)
      .then((d) => setFav(!!d.favorited))
      .catch(() => {})
  }, [product.id])

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      if (fav) {
        const r = await clientApi.favorites.remove(product.id)
        if ("error" in r && r.status === 401) {
          window.location.href = `/login?redirect=/producto/${product.id}`
          return
        }
        setFav(false)
      } else {
        const res = await clientApi.favorites.add(product.id)
        if ("error" in res && res.status === 401) {
          window.location.href = `/login?redirect=/producto/${product.id}`
          return
        }
        setFav(true)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Image
          src={product.images[0] || "/placeholder.svg"}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={toggleFav}
          disabled={loading}
          aria-label="Agregar a favoritos"
          aria-pressed={fav}
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart className={cn("size-4", fav && "fill-primary text-primary")} />
        </button>
        {product.status !== "disponible" && (
          <div className="absolute left-2 top-2">
            <StatusBadge status={product.status} />
          </div>
        )}
        {product.transaction !== "venta" && product.status === "disponible" && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
            {product.transaction === "intercambio" ? "Intercambio" : "Venta / Intercambio"}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-card-foreground">{product.title}</h3>
        </div>
        <p className="text-lg font-bold text-primary">
          {product.transaction === "intercambio" ? "Intercambio" : `S/ ${product.price}`}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-full font-normal">
            {conditionLabels[product.condition]}
          </Badge>
          <span className="truncate">{product.course}</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{product.location}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Eye className="size-3" />
            {product.views}
          </span>
        </div>
      </div>
      <span className="sr-only">{transactionLabels[product.transaction]}</span>
    </Link>
  )
}
