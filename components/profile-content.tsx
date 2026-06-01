"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Star,
  Eye,
  Heart,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { type Product, transactionLabels } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditProductDialog } from "@/components/edit-product-dialog"
import { RatingDisplay } from "@/components/rating-stars"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { clientApi } from "@/lib/client-api"

interface ProfileUser {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  bio: string | null
  phone: string | null
  faculty: string | null
  career: string | null
  avatar: string
  verified: boolean
  ratingAvg: number
  ratingCount: number
  badges: string[]
}

interface ProfileContentProps {
  user: ProfileUser
  initialProducts: Product[]
  stats: { views: number; listings: number; favorites: number }
}

export function ProfileContent({ user: initialUser, initialProducts, stats }: ProfileContentProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [products, setProducts] = useState(initialProducts)
  const [editing, setEditing] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [firstName, setFirstName] = useState(initialUser.firstName)
  const [lastName, setLastName] = useState(initialUser.lastName)
  const [bio, setBio] = useState(initialUser.bio ?? "")
  const [phone, setPhone] = useState(initialUser.phone ?? "")

  const statCards = [
    { label: "Vistas totales", value: stats.views, icon: Eye },
    { label: "Publicaciones", value: stats.listings, icon: ShoppingBag },
    { label: "Favoritos", value: stats.favorites, icon: Heart },
    { label: "Calificación", value: user.ratingAvg.toFixed(1), icon: Star },
  ]

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const data = await clientApi.profile.patch({ firstName, lastName, bio, phone })
      if ("user" in data && data.user) {
        setUser((u) => ({
          ...u,
          firstName: data.user.first_name ?? firstName,
          lastName: data.user.last_name ?? lastName,
          name: data.user.name ?? u.name,
          bio: data.user.bio ?? bio,
          phone: data.user.phone ?? phone,
        }))
        router.refresh()
      }
    } finally {
      setSavingProfile(false)
    }
  }

  function openEdit(product: Product) {
    setEditing(product)
    setDialogOpen(true)
  }

  function handleSaved(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    router.refresh()
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.title}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(product.id)
    try {
      const data = await clientApi.products.delete(product.id)
      if ("error" in data && data.error) {
        alert(data.error)
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      router.refresh()
    } catch {
      alert("Error de conexión")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{user.name}</h1>
            {user.verified && <ShieldCheck className="size-5 text-primary" />}
          </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <RatingDisplay average={user.ratingAvg} count={user.ratingCount} />
          {(user.career || user.faculty) && (
            <p className="text-sm text-muted-foreground">
              {[user.career, user.faculty].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user.badges.map((b) => (
              <Badge key={b} variant="secondary" className="rounded-full text-xs font-normal">
                {b}
              </Badge>
            ))}
          </div>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/publicar">
            <Plus className="size-4" />
            Publicar producto
          </Link>
        </Button>
      </div>

      <form onSubmit={saveProfile} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Editar perfil</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Apellidos</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Descripción personal</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Cuéntanos sobre ti..." />
        </div>
        <div className="space-y-2">
          <Label>Celular (opcional)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+51 9XX XXX XXX" />
        </div>
        <p className="text-xs text-muted-foreground">El correo institucional no se puede cambiar.</p>
        <Button type="submit" disabled={savingProfile}>
          Guardar perfil
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <s.icon className="size-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Mis publicaciones</h2>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="font-medium">Aún no tienes publicaciones</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Publica tu primer material académico desde el botón de arriba.
          </p>
          <Button asChild className="mt-4">
            <Link href="/publicar">Publicar ahora</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {products.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 bg-card p-3 ${i !== 0 ? "border-t border-border" : ""}`}
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={p.images[0] || "/placeholder.svg"} alt={p.title} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/producto/${p.id}`} className="line-clamp-1 font-medium hover:text-primary">
                  {p.title}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {p.transaction === "intercambio" ? "Intercambio" : `S/ ${p.price}`} · {p.views} vistas ·{" "}
                  {transactionLabels[p.transaction]}
                </p>
              </div>
              <Badge variant="secondary" className="hidden rounded-full sm:inline-flex">
                <StatusBadge status={p.status} />
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(p)}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar"
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditProductDialog
        product={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </>
  )
}
