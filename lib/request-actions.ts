import { prisma } from "@/lib/prisma"
import { getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { recordTransactionHistory, updateRequestHistoryStatus } from "@/lib/history"
import { syncProductAvailability } from "@/lib/product-availability"
import type { ProductStatus } from "@/lib/types"

const STATUS_MAP: Record<string, ProductStatus> = {
  compra: "vendido",
  prestamo: "prestado",
  intercambio: "intercambiado",
}

type RequestWithProduct = {
  id: string
  productId: string
  requesterId: string
  ownerId: string
  type: string
  returnDate: Date | null
  product: { id: string; title: string; stock: number }
}

export async function acceptMaterialRequest(materialRequest: RequestWithProduct) {
  const conversation = await getOrCreateConversation(
    materialRequest.requesterId,
    materialRequest.ownerId,
    materialRequest.productId,
  )

  const meta = {
    requestId: materialRequest.id,
    productId: materialRequest.productId,
    otherUserId: materialRequest.ownerId,
    conversationId: conversation.id,
  }

  if (materialRequest.type === "prestamo") {
    if (!materialRequest.returnDate) {
      throw new Error("Falta la fecha de devolución")
    }

    const newStock = Math.max(0, materialRequest.product.stock - 1)
    const updated = await prisma.materialRequest.update({
      where: { id: materialRequest.id },
      data: { status: "aceptada" },
    })

    await prisma.product.update({
      where: { id: materialRequest.productId },
      data: {
        stock: newStock,
        status: newStock <= 0 ? "prestado" : "disponible",
      },
    })

    if (newStock > 0) {
      await syncProductAvailability(materialRequest.productId)
    }

    await updateRequestHistoryStatus(materialRequest.id, "aceptada")

    const dateLabel = materialRequest.returnDate.toLocaleDateString("es-PE", {
      timeZone: "America/Lima",
    })

    await createNotification({
      userId: materialRequest.requesterId,
      type: "request_accepted",
      title: "Préstamo aceptado",
      body: `Tu préstamo de "${materialRequest.product.title}" fue aceptado. Devolución: ${dateLabel}.`,
      metadata: { ...meta, returnDate: materialRequest.returnDate.toISOString() },
    })

    return updated
  }

  if (materialRequest.type === "compra") {
    const newStock = Math.max(0, materialRequest.product.stock - 1)
    const updated = await prisma.materialRequest.update({
      where: { id: materialRequest.id },
      data: { status: "completada" },
    })

    await prisma.product.update({
      where: { id: materialRequest.productId },
      data: {
        stock: newStock,
        status: newStock <= 0 ? "vendido" : "disponible",
      },
    })

    if (newStock > 0) {
      await syncProductAvailability(materialRequest.productId)
    }

    await updateRequestHistoryStatus(materialRequest.id, "completada")
    await recordTransactionHistory(
      materialRequest.id,
      materialRequest.productId,
      materialRequest.requesterId,
      materialRequest.ownerId,
      "compra",
    )

    await createNotification({
      userId: materialRequest.requesterId,
      type: "purchase_completed",
      title: "Venta confirmada",
      body: `El vendedor aceptó la venta de "${materialRequest.product.title}".`,
      metadata: { ...meta, canRate: true },
    })

    return updated
  }

  if (materialRequest.type === "intercambio") {
    const updated = await prisma.materialRequest.update({
      where: { id: materialRequest.id },
      data: { status: "completada" },
    })

    await prisma.product.update({
      where: { id: materialRequest.productId },
      data: { status: "intercambiado" },
    })

    await updateRequestHistoryStatus(materialRequest.id, "completada")
    await recordTransactionHistory(
      materialRequest.id,
      materialRequest.productId,
      materialRequest.requesterId,
      materialRequest.ownerId,
      "intercambio",
    )

    await createNotification({
      userId: materialRequest.requesterId,
      type: "purchase_completed",
      title: "Intercambio aceptado",
      body: `El vendedor aceptó tu propuesta de intercambio por "${materialRequest.product.title}".`,
      metadata: { ...meta, canRate: true },
    })

    return updated
  }

  const newProductStatus = STATUS_MAP[materialRequest.type] ?? "vendido"
  const newStock = Math.max(0, materialRequest.product.stock - 1)
  const updated = await prisma.materialRequest.update({
    where: { id: materialRequest.id },
    data: { status: "completada" },
  })

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

  await updateRequestHistoryStatus(materialRequest.id, "completada")
  return updated
}

export async function confirmLoanReturn(materialRequest: RequestWithProduct) {
  const product = await prisma.product.findUnique({
    where: { id: materialRequest.productId },
    select: { stock: true, status: true },
  })
  if (!product) throw new Error("Producto no encontrado")

  const newStock = product.stock + 1
  const updated = await prisma.materialRequest.update({
    where: { id: materialRequest.id },
    data: { status: "completada" },
  })

  await prisma.product.update({
    where: { id: materialRequest.productId },
    data: {
      stock: newStock,
      status: product.status === "prestado" ? "disponible" : product.status,
    },
  })

  await syncProductAvailability(materialRequest.productId)
  await updateRequestHistoryStatus(materialRequest.id, "completada")
  await recordTransactionHistory(
    materialRequest.id,
    materialRequest.productId,
    materialRequest.requesterId,
    materialRequest.ownerId,
    "prestamo",
  )

  const conversation = await getOrCreateConversation(
    materialRequest.requesterId,
    materialRequest.ownerId,
    materialRequest.productId,
  )

  await createNotification({
    userId: materialRequest.requesterId,
    type: "loan_completed",
    title: "Devolución registrada",
    body: `Se confirmó la devolución de "${materialRequest.product.title}". Puedes calificar al usuario.`,
    metadata: {
      requestId: materialRequest.id,
      productId: materialRequest.productId,
      otherUserId: materialRequest.ownerId,
      conversationId: conversation.id,
      canRate: true,
    },
  })

  return updated
}
