import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { recordTransactionHistory, updateRequestHistoryStatus } from "@/lib/history"
import type { ProductStatus } from "@/lib/types"

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

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_accepted",
      title: "Solicitud aceptada",
      body: `Tu solicitud de "${materialRequest.product.title}" fue aceptada.`,
      metadata: { requestId: id },
    })

    await getOrCreateConversation(materialRequest.requesterId, materialRequest.ownerId, materialRequest.productId)

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

    const otherPending = await prisma.materialRequest.count({
      where: { productId: materialRequest.productId, status: "pendiente" },
    })
    if (otherPending === 0) {
      await prisma.product.update({
        where: { id: materialRequest.productId },
        data: { status: "disponible" },
      })
    }

    await updateRequestHistoryStatus(id, "rechazada")

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_rejected",
      title: "Solicitud rechazada",
      body: `Tu solicitud de "${materialRequest.product.title}" fue rechazada.`,
      metadata: { requestId: id },
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

    await prisma.product.update({
      where: { id: materialRequest.productId },
      data: { status: newProductStatus },
    })

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
      metadata: { requestId: id, canRate: true },
    })

    await createNotification({
      userId: materialRequest.ownerId,
      type: notifType,
      title: "Transacción completada",
      body: `Se completó la operación de "${materialRequest.product.title}". Puedes calificar al usuario.`,
      metadata: { requestId: id, canRate: true },
    })

    return NextResponse.json({ request: updated, canRate: true })
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 403 })
}
