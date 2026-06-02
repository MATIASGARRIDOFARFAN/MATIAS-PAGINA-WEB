"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationMetadata {
  requestId?: string
  productId?: string
  otherUserId?: string
  conversationId?: string
}

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  metadata?: NotificationMetadata | null
}

const CHAT_NOTIFICATION_TYPES = new Set([
  "request_received",
  "request_accepted",
  "request_rejected",
  "purchase_completed",
  "loan_completed",
  "message_received",
])

function getChatHref(n: Notification): string | null {
  if (!CHAT_NOTIFICATION_TYPES.has(n.type)) return null
  const meta = n.metadata
  if (!meta) return null
  if (meta.conversationId) {
    return `/mensajes?conversationId=${encodeURIComponent(meta.conversationId)}`
  }
  if (meta.otherUserId) {
    const params = new URLSearchParams({ to: meta.otherUserId })
    if (meta.productId) params.set("product", meta.productId)
    return `/mensajes?${params.toString()}`
  }
  return null
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  async function load() {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    load()
  }

  async function handleNotificationClick(n: Notification) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: n.id }),
    })

    const href = getChatHref(n)
    if (href) {
      router.push(href)
      return
    }
    router.push("/historial")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notificaciones</span>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs text-primary hover:underline">
              Marcar leídas
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Sin notificaciones</p>
        ) : (
          notifications.slice(0, 8).map((n) => {
            const chatHref = getChatHref(n)
            return (
              <DropdownMenuItem
                key={n.id}
                className="flex cursor-pointer flex-col items-start gap-0.5 p-3"
                onClick={() => handleNotificationClick(n)}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  {n.read && <Check className="size-3 text-muted-foreground" />}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                {chatHref && (
                  <span className="text-[10px] font-medium text-primary">Abrir chat →</span>
                )}
              </DropdownMenuItem>
            )
          })
        )}
        <div className="border-t border-border p-2">
          <Link href="/historial" className="block text-center text-xs text-primary hover:underline">
            Ver historial completo
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
