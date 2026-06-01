import { prisma } from "@/lib/prisma"
import type { RequestType } from "@/lib/types"

export async function addHistoryEntry(data: {
  userId: string
  relatedUserId?: string
  productId?: string
  requestId?: string
  type: string
  status: string
}) {
  return prisma.historyEntry.create({ data })
}

export async function getUserHistory(userId: string) {
  const entries = await prisma.historyEntry.findMany({
    where: { userId },
    include: {
      product: { select: { id: true, title: true, images: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const userIds = [...new Set(entries.map((e) => e.relatedUserId).filter(Boolean))] as string[]
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatar: true },
      })
    : []
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  return entries.map((e) => ({
    id: e.id,
    type: e.type,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    product: e.product
      ? { id: e.product.id, title: e.product.title, image: JSON.parse(e.product.images || "[]")[0] }
      : null,
    relatedUser: e.relatedUserId ? userMap[e.relatedUserId] ?? null : null,
  }))
}

export async function recordRequestHistory(
  requestId: string,
  productId: string,
  requesterId: string,
  ownerId: string,
  type: RequestType,
  status: string,
) {
  await addHistoryEntry({
    userId: requesterId,
    relatedUserId: ownerId,
    productId,
    requestId,
    type: "solicitud_enviada",
    status,
  })
  await addHistoryEntry({
    userId: ownerId,
    relatedUserId: requesterId,
    productId,
    requestId,
    type: "solicitud_recibida",
    status,
  })
}

export async function recordTransactionHistory(
  requestId: string,
  productId: string,
  buyerId: string,
  sellerId: string,
  type: "compra" | "venta" | "prestamo" | "intercambio",
) {
  const buyerType = type === "venta" ? "compra" : type
  const sellerType = type === "compra" ? "venta" : type

  await addHistoryEntry({
    userId: buyerId,
    relatedUserId: sellerId,
    productId,
    requestId,
    type: buyerType,
    status: "completada",
  })
  await addHistoryEntry({
    userId: sellerId,
    relatedUserId: buyerId,
    productId,
    requestId,
    type: sellerType,
    status: "completada",
  })
}
