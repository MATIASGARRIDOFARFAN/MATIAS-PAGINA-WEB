import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth, updateUserRating } from "@/lib/api-helpers"
import { sanitizeOptional, clampStars } from "@/lib/security"
import { createNotification } from "@/lib/notifications"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const requestId = body.requestId ? String(body.requestId) : null
    const toUserId = body.toUserId ? String(body.toUserId) : null
    const productId = body.productId ? String(body.productId) : null
    const stars = clampStars(Number(body.stars))
    const comment = sanitizeOptional(body.comment, 500)

    if (toUserId) {
      if (toUserId === auth.user!.id) {
        return NextResponse.json({ error: "No puedes calificarte a ti mismo" }, { status: 400 })
      }

      const existing = requestId
        ? await prisma.userRating.findFirst({
            where: { fromUserId: auth.user!.id, requestId },
          })
        : null
      if (existing) {
        return NextResponse.json({ error: "Ya calificaste esta transacción" }, { status: 409 })
      }

      const rating = await prisma.userRating.create({
        data: {
          fromUserId: auth.user!.id,
          toUserId,
          requestId,
          stars,
          comment,
        },
      })

      await updateUserRating(toUserId)

      await createNotification({
        userId: toUserId,
        type: "rating_received",
        title: "Nueva calificación",
        body: `${auth.user!.name} te calificó con ${stars} estrellas.`,
        metadata: { ratingId: rating.id },
      })

      return NextResponse.json({ rating })
    }

    if (productId) {
      const existing = requestId
        ? await prisma.productRating.findFirst({
            where: { fromUserId: auth.user!.id, requestId, productId },
          })
        : null
      if (existing) {
        return NextResponse.json({ error: "Ya calificaste este material" }, { status: 409 })
      }

      const rating = await prisma.productRating.create({
        data: {
          fromUserId: auth.user!.id,
          productId,
          requestId,
          stars,
          comment,
        },
      })

      return NextResponse.json({ rating })
    }

    return NextResponse.json({ error: "Indica usuario o producto a calificar" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Error al guardar calificación" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const productId = searchParams.get("productId")

  if (userId) {
    const ratings = await prisma.userRating.findMany({
      where: { toUserId: userId },
      include: { fromUser: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ratingAvg: true, ratingCount: true },
    })
    return NextResponse.json({ ratings, average: user?.ratingAvg ?? 0, count: user?.ratingCount ?? 0 })
  }

  if (productId) {
    const ratings = await prisma.productRating.findMany({
      where: { productId },
      include: { fromUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    const agg = await prisma.productRating.aggregate({
      where: { productId },
      _avg: { stars: true },
      _count: { stars: true },
    })
    return NextResponse.json({
      ratings,
      average: agg._avg.stars ?? 0,
      count: agg._count.stars,
    })
  }

  return NextResponse.json({ error: "Parámetro requerido" }, { status: 400 })
}
