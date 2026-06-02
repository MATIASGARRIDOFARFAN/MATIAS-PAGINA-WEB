"use client"

import { useState } from "react"
import { Repeat, ShoppingCart, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react"
import type { Product } from "@/lib/data"
import { canRequestProduct } from "@/lib/product-availability"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  mode: "compra" | "prestamo" | "intercambio"
}) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState(
    mode === "intercambio"
      ? `Hola, me interesa intercambiar por "${product.title}". Coordinemos en una zona segura del campus.`
      : mode === "prestamo"
        ? `Hola, me gustaría solicitar en préstamo "${product.title}".`
        : `Hola, estoy interesado/a en "${product.title}". ¿Sigue disponible?`,
  )

  const labels = {
    compra: { title: "Solicitar compra", btn: "Solicitar material", icon: ShoppingCart },
    prestamo: { title: "Solicitar préstamo", btn: "Solicitar préstamo", icon: ShoppingCart },
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
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, type: mode, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar")
        if (data.warnings) setError(data.warnings.join(" "))
        return
      }
      setDone(true)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (!available) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setTimeout(() => { setDone(false); setError("") }, 200)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant={mode === "intercambio" ? "outline" : "default"} className="gap-2">
          <Icon className="size-4" />
          {cfg.btn}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="size-14 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Solicitud enviada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.seller.name} fue notificado por correo institucional y en la plataforma. Usa Mensajes para
              coordinar.
            </p>
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Entendido
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{cfg.title}</DialogTitle>
              <DialogDescription>
                Comunicación 100% interna. No se comparten teléfonos ni correos personales.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-accent/50 p-3 text-sm text-primary">
              <ShieldCheck className="size-4 shrink-0" />
              <span>El propietario recibirá notificación en la plataforma y en su @usmp.pe</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-msg">Mensaje</Label>
              <Textarea id="req-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="lg" className="w-full gap-2" onClick={submit} disabled={loading || !message.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
              Enviar solicitud
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
