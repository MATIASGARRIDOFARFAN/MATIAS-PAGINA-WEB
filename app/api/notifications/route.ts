import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getUnreadCount, markAllRead } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unreadCount = await getUnreadCount(auth.user!.id)

  const parsed = notifications.map((n) => {
    let metadata: Record<string, unknown> | null = null
    if (n.metadata) {
      try {
        metadata = JSON.parse(n.metadata) as Record<string, unknown>
      } catch {
        metadata = null
      }
    }
    return { ...n, metadata }
  })

  return NextResponse.json({ notifications: parsed, unreadCount })
}

export async function PATCH(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()

  if (body.markAllRead) {
    await markAllRead(auth.user!.id)
    return NextResponse.json({ ok: true })
  }

  if (body.notificationId) {
    await prisma.notification.updateMany({
      where: { id: body.notificationId, userId: auth.user!.id },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}
