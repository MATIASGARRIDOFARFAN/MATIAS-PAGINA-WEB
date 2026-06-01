"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Heart,
  Eye,
  MapPin,
  ShieldCheck,
  Star,
  ShoppingCart,
  Repeat,
  MessageCircle,
  Calendar,
  Award,
  CheckCircle2,
} from "lucide-react"
import {
  type Product,
  conditionLabels,
  transactionLabels,
  getCategoryName,
} from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { CheckoutDialog } from "@/components/checkout-dialog"
import { RequestDialog } from "@/components/request-dialog"
import { StatusBadge } from "@/components/status-badge"
import { canRequestProduct } from "@/lib/types"

export function ProductDetail({ product }: { product: Product }) {
  const [active, setActive] = useState(0)
  const [fav, setFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/favorites/check?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setFav(!!d.favorited))
      .catch(() => {})
  }, [product.id])

  async function toggleFav() {
    if (favLoading) return
    setFavLoading(true)
    try {
      if (fav) {
        await fetch(`/api/favorites?productId=${product.id}`, { method: "DELETE" })
        setFav(false)
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        })
        if (res.status === 401) {
          window.location.href = `/login?redirect=/producto/${product.id}`
          return
        }
        setFav(true)
      }
    } finally {
      setFavLoading(false)
    }
  }

  const contactHref = `/mensajes?to=${product.seller.id}&product=${product.id}`

  const canBuy = product.transaction !== "intercambio"
  const canExchange = product.transaction !== "venta"

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Inicio
        </Link>
        <span className="mx-1.5">/</span>
        <span>{getCategoryName(product.category)}</span>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Gallery */}
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
            <Image
              src={product.images[active] || "/placeholder.svg"}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              priority
            />
            <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
              {transactionLabels[product.transaction]}
            </Badge>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative size-20 overflow-hidden rounded-lg border-2",
                    active === i ? "border-primary" : "border-border",
                  )}
                >
                  <Image src={img || "/placeholder.svg"} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            <Badge variant="secondary" className="rounded-full">
              {conditionLabels[product.condition]}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {getCategoryName(product.category)}
            </Badge>
          </div>

          <h1 className="mt-3 text-balance text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1>

          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-4" /> {product.views} vistas
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-4" /> {product.favorites} favoritos
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-4" /> {product.createdAt}
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-primary">
            {product.transaction === "intercambio" ? "Solo intercambio" : `S/ ${product.price}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.stock} disponible{product.stock > 1 ? "s" : ""}
          </p>

          {/* Academic tags */}
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Facultad</p>
              <p className="mt-0.5 font-medium leading-tight">{product.faculty}</p>
            </div>
            <div className="border-x border-border">
              <p className="text-xs text-muted-foreground">Carrera</p>
              <p className="mt-0.5 font-medium leading-tight">{product.career}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Curso</p>
              <p className="mt-0.5 font-medium leading-tight">{product.course}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Entrega en <span className="font-medium text-foreground">{product.location}</span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3">
            {canRequestProduct(product.status) ? (
              <>
                {canBuy && <CheckoutDialog product={product} />}
                {canExchange && <RequestDialog product={product} mode="intercambio" />}
                <RequestDialog product={product} mode="prestamo" />
              </>
            ) : (
              <div className="rounded-lg border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
                Este material ya no acepta solicitudes ({product.status}).
              </div>
            )}
            <div className="flex gap-3">
              <Button asChild variant="secondary" size="lg" className="flex-1 gap-2">
                <Link href={contactHref}>
                  <MessageCircle className="size-4" />
                  Mensaje interno
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={toggleFav}
                disabled={favLoading}
                className="gap-2"
                aria-pressed={fav}
              >
                <Heart className={cn("size-4", fav && "fill-primary text-primary")} />
                {fav ? "Guardado" : "Guardar"}
              </Button>
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Por tu seguridad, la coordinación se realiza solo por mensajería interna y correo institucional. No
              compartas números de teléfono ni datos personales.
            </p>
          </div>

          {/* Seller */}
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={product.seller.avatar || "/placeholder.svg"} alt={product.seller.name} />
                <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{product.seller.name}</p>
                  {product.seller.verified && <ShieldCheck className="size-4 shrink-0 text-primary" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{product.seller.career}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star className="size-4 fill-primary text-primary" />
                {product.seller.rating}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.seller.badges.map((b) => (
                <Badge key={b} variant="secondary" className="gap-1 rounded-full text-xs font-normal">
                  {b.includes("Verificado") ? (
                    <CheckCircle2 className="size-3 text-primary" />
                  ) : b.includes("Top") ? (
                    <Award className="size-3 text-primary" />
                  ) : (
                    <ShieldCheck className="size-3 text-primary" />
                  )}
                  {b}
                </Badge>
              ))}
            </div>

            <Separator className="my-3" />
            <div className="grid grid-cols-3 text-center text-sm">
              <div>
                <p className="font-semibold">{product.seller.listings}</p>
                <p className="text-xs text-muted-foreground">Publicaciones</p>
              </div>
              <div>
                <p className="font-semibold">{product.seller.sales}</p>
                <p className="text-xs text-muted-foreground">Ventas</p>
              </div>
              <div>
                <p className="font-semibold">{product.seller.exchanges}</p>
                <p className="text-xs text-muted-foreground">Intercambios</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold">Descripción</h2>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{product.description}</p>
      </div>
    </div>
  )
}
