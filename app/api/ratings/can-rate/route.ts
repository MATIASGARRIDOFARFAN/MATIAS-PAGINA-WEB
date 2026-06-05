import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"

export async function GET(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const toUserId = searchParams.get("toUserId")
  if (!toUserId) {
    return NextResponse.json({ error: "toUserId requerido" }, { status: 400 })
  }

  if (toUserId === auth.user!.id) {
    return NextResponse.json({ canRate: false })
  }

  const completed = await prisma.materialRequest.findFirst({
    where: {
      status: "completada",
      OR: [
        { requesterId: auth.user!.id, ownerId: toUserId },
        { requesterId: toUserId, ownerId: auth.user!.id },
      ],
    },
    orderBy: { updatedAt: "desc" },
  })

  if (!completed) {
    return NextResponse.json({ canRate: false })
  }

  const existing = await prisma.userRating.findFirst({
    where: { fromUserId: auth.user!.id, toUserId },
  })

  return NextResponse.json({
    canRate: !existing,
    requestId: completed.id,
    toUserId,
  })
}
