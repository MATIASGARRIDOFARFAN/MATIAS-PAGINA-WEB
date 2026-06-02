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

export async function updateRequestHistoryStatus(requestId: string, status: string) {
  await prisma.historyEntry.updateMany({
    where: { requestId },
    data: { status },
  })
}

function parseProductImage(images: string): string | undefined {
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed[0] : undefined
  } catch {
    return undefined
  }
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

  const coveredRequestIds = new Set(
    entries.map((e) => e.requestId).filter((id): id is string => !!id),
  )

  const requests = await prisma.materialRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { ownerId: userId }],
      ...(coveredRequestIds.size > 0 ? { id: { notIn: [...coveredRequestIds] } } : {}),
    },
    include: {
      product: { select: { id: true, title: true, images: true } },
      requester: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const userIds = [
    ...new Set([
      ...entries.map((e) => e.relatedUserId).filter(Boolean),
      ...requests.flatMap((r) => [r.requesterId, r.ownerId]),
    ]),
  ] as string[]

  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, avatar: true },
      })
    : []
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]))

  const fromEntries = entries.map((e) => ({
    id: e.id,
    type: e.type,
    status: e.status,
    title: null as string | null,
    createdAt: e.createdAt.toISOString(),
    product: e.product
      ? {
          id: e.product.id,
          title: e.product.title,
          image: parseProductImage(e.product.images || "[]"),
        }
      : null,
    relatedUser: e.relatedUserId ? userMap[e.relatedUserId] ?? null : null,
  }))

  const fromRequests = requests.map((r) => {
    const isRequester = r.requesterId === userId
    return {
      id: `req-${r.id}`,
      type: isRequester ? "solicitud_enviada" : "solicitud_recibida",
      status: r.status,
      title: null as string | null,
      createdAt: r.createdAt.toISOString(),
      product: r.product
        ? {
            id: r.product.id,
            title: r.product.title,
            image: parseProductImage(r.product.images || "[]"),
          }
        : null,
      relatedUser: isRequester
        ? userMap[r.ownerId] ?? { id: r.ownerId, name: r.owner.name, avatar: r.owner.avatar }
        : userMap[r.requesterId] ?? {
            id: r.requesterId,
            name: r.requester.name,
            avatar: r.requester.avatar,
          },
    }
  })

  const seenIds = new Set([
    ...fromEntries.map((e) => e.id),
    ...fromRequests.map((r) => r.id),
  ])

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
  })

  const notifProductIds = notifications
    .map((n) => {
      if (!n.metadata) return null
      try {
        const meta = JSON.parse(n.metadata) as { productId?: string }
        return meta.productId ?? null
      } catch {
        return null
      }
    })
    .filter((id): id is string => !!id)

  const notifProducts = notifProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: [...new Set(notifProductIds)] } },
        select: { id: true, title: true, images: true },
      })
    : []
  const productMap = Object.fromEntries(notifProducts.map((p) => [p.id, p]))

  const fromNotifications = notifications
    .filter((n) => !seenIds.has(`notif-${n.id}`))
    .map((n) => {
      let productId: string | null = null
      if (n.metadata) {
        try {
          productId = (JSON.parse(n.metadata) as { productId?: string }).productId ?? null
        } catch {
          productId = null
        }
      }
      const product = productId ? productMap[productId] : null
      return {
        id: `notif-${n.id}`,
        type: n.type,
        status: "registrada",
        title: n.title,
        createdAt: n.createdAt.toISOString(),
        product: product
          ? {
              id: product.id,
              title: product.title,
              image: parseProductImage(product.images || "[]"),
            }
          : null,
        relatedUser: null,
      }
    })

  return [...fromEntries, ...fromRequests, ...fromNotifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100)
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
