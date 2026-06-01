import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function requireAuth() {
  const session = await getSession()
  if (!session) return { error: "No autenticado", status: 401 as const, session: null, user: null }

  const user = await prisma.user.findUnique({ where: { id: session.id } })
  if (!user) return { error: "Usuario no encontrado", status: 404 as const, session, user: null }
  if (user.suspended) return { error: "Cuenta suspendida", status: 403 as const, session, user: null }

  return { session, user, error: null, status: null }
}

export async function requireVerifiedAuth() {
  return requireAuth()
}

export async function requireAdmin() {
  const result = await requireVerifiedAuth()
  if (result.error) return result
  if (result.user!.role !== "admin") {
    return { error: "Acceso denegado", status: 403 as const, session: result.session, user: result.user }
  }
  return result
}

export async function getOrCreateConversation(userId: string, otherUserId: string, productId?: string) {
  const [p1, p2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId]

  const existing = await prisma.conversation.findFirst({
    where: {
      participant1Id: p1,
      participant2Id: p2,
      productId: productId ?? null,
    },
  })
  if (existing) return existing

  return prisma.conversation.create({
    data: {
      participant1Id: p1,
      participant2Id: p2,
      productId: productId ?? null,
    },
  })
}

export async function updateUserRating(userId: string) {
  const agg = await prisma.userRating.aggregate({
    where: { toUserId: userId },
    _avg: { stars: true },
    _count: { stars: true },
  })
  await prisma.user.update({
    where: { id: userId },
    data: {
      ratingAvg: agg._avg.stars ?? 0,
      ratingCount: agg._count.stars,
    },
  })
}
