"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Send, ShieldAlert } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { normalizeAvatarUrl } from "@/lib/security"

interface Conversation {
  id: string
  product: { id: string; title: string } | null
  otherUser: { id: string; name: string; avatar: string }
  lastMessage: { content: string; createdAt: string; senderId: string } | null
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  filtered: boolean
  filterReason: string | null
  sender: { id: string; name: string; avatar: string }
}

export function InternalMessenger({ initialUserId, initialProductId }: { initialUserId?: string; initialProductId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [warning, setWarning] = useState<string | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  async function loadConversations() {
    const res = await fetch("/api/conversations")
    if (!res.ok) return
    const data = await res.json()
    setConversations(data.conversations ?? [])
    if (initialUserId && !activeId) {
      const existing = data.conversations?.find((c: Conversation) => c.otherUser.id === initialUserId)
      if (existing) setActiveId(existing.id)
      else {
        const createRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherUserId: initialUserId, productId: initialProductId }),
        })
        const created = await createRes.json()
        if (created.conversationId) {
          await loadConversations()
          setActiveId(created.conversationId)
        }
      }
    }
  }

  async function loadMessages(convId: string, scrollToBottom = false) {
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (!res.ok) return
    const data = await res.json()
    setMessages(data.messages ?? [])

    if (scrollToBottom && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current
        if (el) el.scrollTop = el.scrollHeight
      })
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMyId(d.user?.id ?? null))
    loadConversations()
  }, [])

  useEffect(() => {
    if (!activeId) return
    loadMessages(activeId, false)
    const interval = setInterval(() => loadMessages(activeId, false), 5000)
    return () => clearInterval(interval)
  }, [activeId])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !activeId) return
    setWarning(null)

    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    })

    const data = await res.json()
    if (!res.ok) {
      setWarning(data.error + (data.warnings?.length ? `: ${data.warnings.join(" ")}` : ""))
      return
    }

    if (data.warnings?.length) {
      setWarning(data.warnings.join(" "))
    }

    setText("")
    await loadMessages(activeId, true)
    loadConversations()
  }

  const active = conversations.find((c) => c.id === activeId)

  function UserLink({
    user,
    className,
  }: {
    user: { id: string; name: string; avatar: string }
    className?: string
  }) {
    const avatarSrc = normalizeAvatarUrl(user.avatar) || "/placeholder.svg"
    return (
      <Link href={`/usuario/${user.id}`} className={cn("flex items-center gap-3 hover:opacity-90", className)}>
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={avatarSrc} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium hover:text-primary">{user.name}</p>
        </div>
      </Link>
    )
  }

  return (
    <div className="grid h-[560px] overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[280px_1fr]">
      <div className="hidden border-r border-border sm:block overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No tienes conversaciones aún.</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveId(c.id)}
              onKeyDown={(e) => e.key === "Enter" && setActiveId(c.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 border-b border-border p-3 text-left transition-colors hover:bg-secondary",
                activeId === c.id && "bg-accent",
              )}
            >
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <UserLink user={c.otherUser} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessage?.content ?? c.product?.title ?? "Sin mensajes"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col">
        {active ? (
          <>
            <div className="border-b border-border p-3">
              <UserLink user={active.otherUser} />
              <p className="mt-1 pl-[52px] text-xs text-muted-foreground">
                {active.product ? (
                  <>
                    Sobre:{" "}
                    <Link href={`/producto/${active.product.id}`} className="hover:text-primary">
                      {active.product.title}
                    </Link>
                  </>
                ) : (
                  "Chat interno USMP Market"
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <ShieldAlert className="size-3.5 shrink-0" />
              No compartas teléfonos, correos personales ni enlaces. Toda la comunicación es interna.
            </div>

            <div
              ref={messagesContainerRef}
              className="flex flex-1 flex-col gap-2 overflow-y-auto bg-secondary/30 p-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    m.senderId === myId
                      ? "self-end bg-primary text-primary-foreground"
                      : "self-start border border-border bg-card",
                  )}
                >
                  {m.content}
                  {m.filtered && (
                    <p className="mt-1 text-[10px] opacity-70">Contenido filtrado por seguridad</p>
                  )}
                </div>
              ))}
            </div>

            {warning && (
              <p className="border-t border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {warning}
              </p>
            )}

            <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="rounded-full"
              />
              <Button type="submit" size="icon" className="shrink-0 rounded-full" aria-label="Enviar">
                <Send className="size-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecciona una conversación
          </div>
        )}
      </div>
    </div>
  )
}
