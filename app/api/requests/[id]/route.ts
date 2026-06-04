import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { updateRequestHistoryStatus } from "@/lib/history"
import { syncProductAvailability } from "@/lib/product-availability"
import { acceptMaterialRequest, confirmLoanReturn } from "@/lib/request-actions"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? "")

  const materialRequest = await prisma.materialRequest.findUnique({
    where: { id },
    include: { product: true, requester: true },
  })

  if (!materialRequest) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  const isOwner = materialRequest.ownerId === auth.user!.id
  const isRequester = materialRequest.requesterId === auth.user!.id

  if (action === "accept" && isOwner) {
    if (materialRequest.status !== "pendiente") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 })
    }

    try {
      const updated = await acceptMaterialRequest({
        id: materialRequest.id,
        productId: materialRequest.productId,
        requesterId: materialRequest.requesterId,
        ownerId: materialRequest.ownerId,
        type: materialRequest.type,
        returnDate: materialRequest.returnDate,
        product: {
          id: materialRequest.product.id,
          title: materialRequest.product.title,
          stock: materialRequest.product.stock,
        },
      })
      return NextResponse.json({ request: updated })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al aceptar"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  if (action === "reject" && isOwner) {
    if (materialRequest.status !== "pendiente") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 })
    }

    const updated = await prisma.materialRequest.update({
      where: { id },
      data: { status: "rechazada" },
    })

    await syncProductAvailability(materialRequest.productId)
    await updateRequestHistoryStatus(id, "rechazada")

    const conversation = await getOrCreateConversation(
      materialRequest.requesterId,
      materialRequest.ownerId,
      materialRequest.productId,
    )

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_rejected",
      title: "Solicitud rechazada",
      body: `Tu solicitud de "${materialRequest.product.title}" fue rechazada.`,
      metadata: {
        requestId: id,
        productId: materialRequest.productId,
        otherUserId: materialRequest.ownerId,
        conversationId: conversation.id,
      },
    })

    return NextResponse.json({ request: updated })
  }

  if (action === "return" && isOwner) {
    if (materialRequest.type !== "prestamo" || materialRequest.status !== "aceptada") {
      return NextResponse.json({ error: "Solo préstamos activos pueden confirmar devolución" }, { status: 400 })
    }

    const updated = await confirmLoanReturn({
      id: materialRequest.id,
      productId: materialRequest.productId,
      requesterId: materialRequest.requesterId,
      ownerId: materialRequest.ownerId,
      type: materialRequest.type,
      returnDate: materialRequest.returnDate,
      product: {
        id: materialRequest.product.id,
        title: materialRequest.product.title,
        stock: materialRequest.product.stock,
      },
    })

    return NextResponse.json({ request: updated, canRate: true })
  }

  if (action === "complete" && (isOwner || isRequester)) {
    if (materialRequest.status !== "aceptada" || materialRequest.type !== "prestamo") {
      return NextResponse.json({ error: "Usa confirmar devolución para préstamos activos" }, { status: 400 })
    }
    if (!isOwner) {
      return NextResponse.json({ error: "Solo el propietario puede confirmar la devolución" }, { status: 403 })
    }

    const updated = await confirmLoanReturn({
      id: materialRequest.id,
      productId: materialRequest.productId,
      requesterId: materialRequest.requesterId,
      ownerId: materialRequest.ownerId,
      type: materialRequest.type,
      returnDate: materialRequest.returnDate,
      product: {
        id: materialRequest.product.id,
        title: materialRequest.product.title,
        stock: materialRequest.product.stock,
      },
    })

    return NextResponse.json({ request: updated, canRate: true })
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 403 })
}
