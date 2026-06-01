"use client"

import { useState } from "react"
import { ShoppingCart, CheckCircle2, Loader2 } from "lucide-react"
import type { Product } from "@/lib/data"
import { canRequestProduct } from "@/lib/types"
import { clientApi } from "@/lib/client-api"
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
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!canRequestProduct(product.status)) return null

  async function confirmPurchase() {
    setLoading(true)
    setError("")
    try {
      const data = await clientApi.requests.create({
        productId: product.id,
        type: "compra",
        message: `Solicitud de compra de "${product.title}" por S/ ${product.price}.`,
      })
      if ("error" in data && data.error) {
        setError(data.error)
        return
      }
      setDone(true)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setTimeout(() => { setDone(false); setError("") }, 200)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <ShoppingCart className="size-4" />
          Comprar ahora
        </Button>
      </DialogTrigger>
      <DialogContent>
        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="size-14 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Solicitud de compra enviada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando el vendedor acepte y complete la transacción, el material pasará a estado Vendido.
            </p>
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Entendido
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar compra</DialogTitle>
              <DialogDescription>
                Se enviará una solicitud al vendedor. La coordinación es por mensajería interna.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-3">
              <p className="text-sm font-medium">{product.title}</p>
              <p className="font-bold text-primary">S/ {product.price}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button size="lg" className="w-full gap-2" onClick={confirmPurchase} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirmar solicitud de compra"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
