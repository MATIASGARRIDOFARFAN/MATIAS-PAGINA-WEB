"use client"

import { useState } from "react"
import { Loader2, Package, Repeat, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { REQUEST_STATUS_LABELS, type RequestStatus, type RequestType } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface ChatMaterialRequest {
  id: string
  type: RequestType
  status: RequestStatus
  message: string | null
  returnDate: string | null
  requesterId: string
  ownerId: string
  product: { id: string; title: string }
  requester: { id: string; name: string }
  owner: { id: string; name: string }
}

const TYPE_LABELS: Record<RequestType, string> = {
  compra: "Solicitud de compra",
  prestamo: "Solicitud de préstamo",
  intercambio: "Propuesta de intercambio",
}

const TYPE_ICONS: Record<RequestType, typeof ShoppingCart> = {
  compra: ShoppingCart,
  prestamo: Package,
  intercambio: Repeat,
}

function formatReturnDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { timeZone: "America/Lima" })
}

export function ChatRequestCard({
  request,
  currentUserId,
  onUpdated,
}: {
  request: ChatMaterialRequest
  currentUserId: string
  onUpdated: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  const isOwner = request.ownerId === currentUserId
  const Icon = TYPE_ICONS[request.type]

  async function patch(action: string) {
    setLoading(action)
    setError("")
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la acción")
        return
      }
      onUpdated()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(null)
    }
  }

  const acceptLabel =
    request.type === "compra"
      ? "Aceptar venta"
      : request.type === "prestamo"
        ? "Aceptar préstamo"
        : "Aceptar intercambio"

  const showOwnerActions = isOwner && request.status === "pendiente"
  const showReturnConfirm =
    isOwner && request.type === "prestamo" && request.status === "aceptada"

  if (request.status === "rechazada" || request.status === "completada") {
    return (
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-muted-foreground" />
          <span className="font-medium">{TYPE_LABELS[request.type]}</span>
          <Badge variant="secondary" className="ml-auto">
            {REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{request.product.title}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-b border-primary/20 bg-primary/5 px-4 py-3",
        request.status === "pendiente" && "bg-amber-50 dark:bg-amber-950/20",
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{TYPE_LABELS[request.type]}</p>
          <p className="text-xs text-muted-foreground">
            {isOwner
              ? `De ${request.requester.name} · ${request.product.title}`
              : `Para ${request.owner.name} · ${request.product.title}`}
          </p>
          {request.message && (
            <p className="mt-2 rounded-lg border border-border bg-card p-2 text-sm">
              {request.type === "intercambio" ? (
                <>
                  <span className="text-xs font-medium text-muted-foreground">Ofrece: </span>
                  {request.message}
                </>
              ) : (
                request.message
              )}
            </p>
          )}
          {request.returnDate && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Devolución: </span>
              <span className="font-medium">{formatReturnDate(request.returnDate)}</span>
            </p>
          )}
          <Badge variant="outline" className="mt-2">
            {REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {showOwnerActions && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="gap-1"
            disabled={!!loading}
            onClick={() => patch("accept")}
          >
            {loading === "accept" ? <Loader2 className="size-3 animate-spin" /> : null}
            {acceptLabel}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!loading}
            onClick={() => patch("reject")}
          >
            {loading === "reject" ? <Loader2 className="size-3 animate-spin" /> : null}
            Rechazar
          </Button>
        </div>
      )}

      {showReturnConfirm && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Cuando recibas el material de vuelta, confirma la devolución para liberar el stock.
          </p>
          <Button size="sm" disabled={!!loading} onClick={() => patch("return")}>
            {loading === "return" ? <Loader2 className="size-3 animate-spin" /> : null}
            Confirmar devolución
          </Button>
        </div>
      )}

      {!isOwner && request.status === "pendiente" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Esperando respuesta del vendedor. Puedes seguir coordinando por este chat.
        </p>
      )}

      {!isOwner && request.status === "aceptada" && request.type === "prestamo" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Préstamo activo
          {request.returnDate ? ` · devuelve antes del ${formatReturnDate(request.returnDate)}` : ""}.
        </p>
      )}
    </div>
  )
}
