"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Repeat, CalendarIcon, Loader2, ShieldCheck } from "lucide-react"
import type { Product } from "@/lib/data"
import { canRequestProduct } from "@/lib/product-availability"
import { buildChatUrl } from "@/lib/chat-navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"

export function RequestDialog({
  product,
  mode,
}: {
  product: Product
  mode: "prestamo" | "intercambio"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [returnDate, setReturnDate] = useState<Date | undefined>()
  const [message, setMessage] = useState(
    mode === "intercambio" ? "" : `Solicitud de préstamo de "${product.title}".`,
  )

  const labels = {
    prestamo: { title: "Solicitar préstamo", btn: "Solicitar préstamo", icon: CalendarIcon },
    intercambio: { title: "Proponer intercambio", btn: "Proponer intercambio", icon: Repeat },
  }
  const cfg = labels[mode]
  const Icon = cfg.icon
  const available = canRequestProduct(
    product.status,
    product.stock,
    product.activeRequests ?? 0,
  )

  async function submit() {
    if (mode === "intercambio" && !message.trim()) {
      setError("Indica qué material ofreces a cambio")
      return
    }
    if (mode === "prestamo" && !returnDate) {
      setError("Selecciona la fecha de devolución")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: mode,
          message: message.trim(),
          returnDate: returnDate?.toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar")
        if (data.warnings) setError(data.warnings.join(" "))
        return
      }
      setOpen(false)
      router.push(
        buildChatUrl({
          sellerId: product.seller.id,
          productId: product.id,
          conversationId: data.conversationId,
        }),
      )
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (!available) return null

  const minReturn = new Date()
  minReturn.setHours(0, 0, 0, 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setError("")
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="gap-2">
          <Icon className="size-4" />
          {cfg.btn}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cfg.title}</DialogTitle>
          <DialogDescription>
            Se creará la solicitud y abrirás el chat con el vendedor para coordinar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 p-3 text-sm text-primary">
          <ShieldCheck className="size-4 shrink-0" />
          <span>El propietario verá tu solicitud en el chat y podrá aceptarla o rechazarla.</span>
        </div>

        {mode === "intercambio" && (
          <div className="space-y-2">
            <Label htmlFor="req-offer">¿Qué ofreces a cambio?</Label>
            <Textarea
              id="req-offer"
              rows={4}
              placeholder='Ej: "Libro de Cálculo 2, buen estado"'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        )}

        {mode === "prestamo" && (
          <>
            <div className="space-y-2">
              <Label>Fecha de devolución</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !returnDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {returnDate
                      ? format(returnDate, "PPP", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    disabled={(date) => date < minReturn}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-msg">Mensaje (opcional)</Label>
              <Textarea id="req-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full gap-2" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirmar y abrir chat"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
