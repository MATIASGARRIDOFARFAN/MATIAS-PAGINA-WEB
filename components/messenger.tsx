"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Msg {
  from: "me" | "them"
  text: string
  time: string
}

const conversations = [
  {
    id: "c1",
    name: "Camila Rojas",
    avatar: "/diverse-students-studying.png",
    product: "Laptop HP Pavilion i5",
    preview: "Sí, sigue disponible 😊",
    messages: [
      { from: "me", text: "Hola, ¿la laptop sigue disponible?", time: "10:02" },
      { from: "them", text: "Sí, sigue disponible 😊", time: "10:05" },
      { from: "them", text: "¿Te interesa coordinar en la biblioteca?", time: "10:05" },
    ] as Msg[],
  },
  {
    id: "c2",
    name: "Diego Fernández",
    avatar: "/male-student.png",
    product: "Calculadora Casio fx-991ES",
    preview: "Acepto el intercambio por el libro",
    messages: [
      { from: "them", text: "Acepto el intercambio por el libro", time: "Ayer" },
    ] as Msg[],
  },
]

export function Messenger() {
  const [activeId, setActiveId] = useState(conversations[0].id)
  const [drafts, setDrafts] = useState<Record<string, Msg[]>>({})
  const [text, setText] = useState("")

  const active = conversations.find((c) => c.id === activeId)!
  const messages = [...active.messages, ...(drafts[activeId] ?? [])]

  function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setDrafts((d) => ({
      ...d,
      [activeId]: [...(d[activeId] ?? []), { from: "me", text: text.trim(), time: "Ahora" }],
    }))
    setText("")
  }

  return (
    <div className="grid h-[560px] overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[280px_1fr]">
      {/* List */}
      <div className="hidden border-r border-border sm:block">
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors hover:bg-secondary",
              activeId === c.id && "bg-accent",
            )}
          >
            <Avatar className="size-10">
              <AvatarImage src={c.avatar || "/placeholder.svg"} alt={c.name} />
              <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.preview}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-border p-3">
          <Avatar className="size-9">
            <AvatarImage src={active.avatar || "/placeholder.svg"} alt={active.name} />
            <AvatarFallback>{active.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{active.name}</p>
            <p className="text-xs text-muted-foreground">Sobre: {active.product}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-secondary/30 p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                m.from === "me"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-card text-card-foreground border border-border",
              )}
            >
              {m.text}
              <span
                className={cn(
                  "ml-2 text-[10px]",
                  m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {m.time}
              </span>
            </div>
          ))}
        </div>

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
      </div>
    </div>
  )
}
