"use client"

import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Eye, Heart, ShoppingBag, Star, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RatingDisplay } from "@/components/rating-stars"
import { type Product } from "@/lib/data"
import { normalizeAvatarUrl } from "@/lib/security"
import { transactionLabels } from "@/lib/data"
import { RateUserDialog } from "@/components/rate-user-dialog"

interface PublicUser {
  id: string
  name: string
  bio: string | null
  avatar: string
  faculty: string | null
  career: string | null
  verified: boolean
  ratingAvg: number
  ratingCount: number
  badges: string[]
}

export function PublicProfile({
  user,
  products,
  stats,
  isOwnProfile,
}: {
  user: PublicUser
  products: Product[]
  stats: { views: number; listings: number; favorites: number }
  isOwnProfile: boolean
}) {
  const avatarSrc = normalizeAvatarUrl(user.avatar) || "/placeholder.svg"

  const statCards = [
    { label: "Vistas totales", value: stats.views, icon: Eye },
    { label: "Publicaciones", value: stats.listings, icon: ShoppingBag },
    { label: "Favoritos en sus publicaciones", value: stats.favorites, icon: Heart },
    { label: "Calificación", value: user.ratingAvg.toFixed(1), icon: Star },
  ]

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          <AvatarImage key={avatarSrc} src={avatarSrc} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{user.name}</h1>
            {user.verified && <ShieldCheck className="size-5 text-primary" />}
          </div>
          {(user.career || user.faculty) && (
            <p className="text-sm text-muted-foreground">
              {[user.career, user.faculty].filter(Boolean).join(" · ")}
            </p>
          )}
          <RatingDisplay average={user.ratingAvg} count={user.ratingCount} />
          {user.bio && <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.badges.map((b) => (
              <Badge key={b} variant="secondary" className="rounded-full text-xs font-normal">
                {b}
              </Badge>
            ))}
          </div>
        </div>
        {!isOwnProfile && (
          <Button asChild className="gap-1.5">
            <Link href={`/mensajes?to=${user.id}`}>
              <MessageCircle className="size-4" />
              Enviar mensaje
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="size-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Publicaciones</h2>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este usuario aún no tiene publicaciones.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/producto/${p.id}`}
              className="overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
            >
              <div className="relative aspect-square bg-secondary">
                <Image
                  src={p.images[0] || "/placeholder.svg"}
                  alt={p.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                <p className="mt-1 text-sm text-primary">
                  {p.transaction === "intercambio" ? "Intercambio" : `S/ ${p.price}`}
                </p>
                <p className="text-xs text-muted-foreground">{transactionLabels[p.transaction]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <RateUserDialog
        toUserId={user.id}
        toUserName={user.name}
        requestId=""
      />
      <ReviewsSection userId={user.id} />
    </>
  )
}
