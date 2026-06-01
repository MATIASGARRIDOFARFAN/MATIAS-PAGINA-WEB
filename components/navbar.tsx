"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, MessageCircle, Plus, User, LogOut, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { NotificationBell } from "@/components/notification-bell"

interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
}

export function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
  }, [])

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/usmp-logo.png"
            alt="Universidad de San Martín de Porres"
            width={130}
            height={40}
            className="h-9 w-auto"
            priority
          />
          <span className="sr-only">USMP Market</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground lg:inline">
                {user.name.split(" ")[0]}
              </span>
              <NotificationBell />
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/historial" aria-label="Historial">
                  <History className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/favoritos" aria-label="Favoritos">
                  <Heart className="size-5" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/mensajes" aria-label="Mensajes">
                  <MessageCircle className="size-5" />
                </Link>
              </Button>
              <Button asChild className="gap-1.5 rounded-full">
                <Link href="/publicar">
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Publicar</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" className="rounded-full">
                <Link href="/perfil" aria-label="Mi perfil">
                  <User className="size-5" />
                </Link>
              </Button>
              {user.role === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/login">Registrarse</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  )
}
