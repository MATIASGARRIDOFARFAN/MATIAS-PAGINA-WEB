import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { recordTransactionHistory, updateRequestHistoryStatus } from "@/lib/history"
import type { ProductStatus } from "@/lib/types"
import { syncProductAvailability } from "@/lib/product-availability"

const STATUS_MAP: Record<string, ProductStatus> = {
  compra: "vendido",
  prestamo: "prestado",
  intercambio: "intercambiado",
}

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

    const updated = await prisma.materialRequest.update({
      where: { id },
      data: { status: "aceptada" },
    })

    await updateRequestHistoryStatus(id, "aceptada")

    const conversation = await getOrCreateConversation(
      materialRequest.requesterId,
      materialRequest.ownerId,
      materialRequest.productId,
    )

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_accepted",
      title: "Solicitud aceptada",
      body: `Tu solicitud de "${materialRequest.product.title}" fue aceptada.`,
      metadata: {
        requestId: id,
        productId: materialRequest.productId,
        otherUserId: materialRequest.ownerId,
        conversationId: conversation.id,
      },
    })

    return NextResponse.json({ request: updated })
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

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_rejected",
      title: "Solicitud rechazada",
      body: `Tu solicitud de "${materialRequest.product.title}" fue rechazada.`,
      metadata: {
        requestId: id,
        productId: materialRequest.productId,
        otherUserId: materialRequest.ownerId,
      },
    })

    return NextResponse.json({ request: updated })
  }

  if (action === "complete" && (isOwner || isRequester)) {
    if (materialRequest.status !== "aceptada") {
      return NextResponse.json({ error: "Solo se pueden completar solicitudes aceptadas" }, { status: 400 })
    }

    const newProductStatus = STATUS_MAP[materialRequest.type] ?? "vendido"

    const updated = await prisma.materialRequest.update({
      where: { id },
      data: { status: "completada" },
    })

    const product = await prisma.product.findUnique({
      where: { id: materialRequest.productId },
      select: { stock: true },
    })
    const newStock = Math.max(0, (product?.stock ?? 1) - 1)

    await prisma.product.update({
      where: { id: materialRequest.productId },
      data: {
        stock: newStock,
        status: newStock <= 0 ? newProductStatus : "disponible",
      },
    })

    if (newStock > 0) {
      await syncProductAvailability(materialRequest.productId)
    }

    const historyType =
      materialRequest.type === "compra"
        ? "compra"
        : materialRequest.type === "prestamo"
          ? "prestamo"
          : "intercambio"

    await recordTransactionHistory(
      id,
      materialRequest.productId,
      materialRequest.requesterId,
      materialRequest.ownerId,
      historyType,
    )

    const notifType =
      materialRequest.type === "prestamo" ? "loan_completed" : "purchase_completed"

    await createNotification({
      userId: materialRequest.requesterId,
      type: notifType,
      title: "Transacción completada",
      body: `Se completó la operación de "${materialRequest.product.title}". Puedes calificar al usuario.`,
      metadata: {
        requestId: id,
        productId: materialRequest.productId,
        otherUserId: materialRequest.ownerId,
        canRate: true,
      },
    })

    await createNotification({
      userId: materialRequest.ownerId,
      type: notifType,
      title: "Transacción completada",
      body: `Se completó la operación de "${materialRequest.product.title}". Puedes calificar al usuario.`,
      metadata: {
        requestId: id,
        productId: materialRequest.productId,
        otherUserId: materialRequest.requesterId,
        canRate: true,
      },
    })

    return NextResponse.json({ request: updated, canRate: true })
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 403 })
}
