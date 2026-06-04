"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Loader2 } from "lucide-react"
import type { Product } from "@/lib/data"
import { canRequestProduct } from "@/lib/product-availability"
import { buildChatUrl } from "@/lib/chat-navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"

export function CheckoutDialog({ product }: { product: Product }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!canRequestProduct(product.status, product.stock, product.activeRequests ?? 0)) return null

  async function confirmPurchase() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: "compra",
          message: `Solicitud de compra de "${product.title}" por S/ ${product.price}.`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar")
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

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError("") }}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="gap-2">
          <ShoppingCart className="size-4" />
          Solicitar compra
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar compra</DialogTitle>
          <DialogDescription>
            Se enviará una solicitud al vendedor y abrirás el chat para coordinar la entrega.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
          <p className="text-sm font-medium">{product.title}</p>
          <p className="font-bold text-primary">S/ {product.price}</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full gap-2" onClick={confirmPurchase} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirmar y abrir chat"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
