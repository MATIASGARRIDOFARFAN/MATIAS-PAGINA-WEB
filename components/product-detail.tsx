"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Heart,
  Eye,
  MapPin,
  ShieldCheck,
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
import { canRequestProduct } from "@/lib/product-availability"
import { RatingDisplay } from "@/components/rating-stars"
import { RateUserDialog } from "@/components/rate-user-dialog"
import { normalizeAvatarUrl } from "@/lib/security"

export function ProductDetail({ product }: { product: Product }) {
  const [active, setActive] = useState(0)
  const [fav, setFav] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [canRate, setCanRate] = useState(false)
  const [rateRequestId, setRateRequestId] = useState<string | null>(null)
  const [rateChecked, setRateChecked] = useState(false)

  const contactHref = `/mensajes?to=${product.seller.id}&product=${product.id}`
  const sellerProfileHref = `/usuario/${product.seller.id}`
  const sellerAvatar = normalizeAvatarUrl(product.seller.avatar) || "/placeholder.svg"

  const canBuy = product.transaction !== "intercambio"
  const canExchange = product.transaction !== "venta"

  useEffect(() => {
    fetch(`/api/favorites?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => setFav(!!d.favorited))
      .catch(() => setFav(false))
  }, [product.id])

  useEffect(() => {
    fetch(`/api/ratings/can-rate?toUserId=${product.seller.id}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setCanRate(!!data.canRate)
          setRateRequestId(data.requestId ?? null)
        }
      })
      .catch(() => setCanRate(false))
      .finally(() => setRateChecked(true))
  }, [product.seller.id])

  async function toggleFav() {
    if (favLoading) return
    setFavLoading(true)
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (res.ok) setFav(data.favorited)
    } finally {
      setFavLoading(false)
    }
  }

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

          <div className="mt-6 flex flex-col gap-3">
            {canRequestProduct(
              product.status,
              product.stock,
              product.activeRequests ?? 0,
            ) ? (
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

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <Link href={sellerProfileHref} className="flex items-center gap-3 hover:opacity-90">
              <Avatar className="size-12">
                <AvatarImage key={sellerAvatar} src={sellerAvatar} alt={product.seller.name} />
                <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold hover:text-primary">{product.seller.name}</p>
                  {product.seller.verified && <ShieldCheck className="size-4 shrink-0 text-primary" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{product.seller.career}</p>
                <div className="mt-1">
                  <RatingDisplay
                    average={product.seller.rating}
                    count={product.seller.ratingCount}
                  />
                </div>
              </div>
            </Link>

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

            {rateChecked && canRate && rateRequestId && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-2 text-xs text-muted-foreground">
                  Completaste una transacción con este vendedor. Tu opinión ayuda a la comunidad.
                </p>
                <RateUserDialog
                  toUserId={product.seller.id}
                  toUserName={product.seller.name}
                  requestId={rateRequestId}
                />
              </div>
            )}

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

      <div className="mt-10 max-w-3xl">
        <h2 className="text-lg font-semibold">Descripción</h2>
        <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{product.description}</p>
      </div>
    </div>
  )
}
