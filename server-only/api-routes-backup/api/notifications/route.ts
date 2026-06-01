import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getUnreadCount, markAllRead, getUserNotifications } from "@/lib/notifications"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const notifications = await getUserNotifications(auth.user!.id)
  const unreadCount = await getUnreadCount(auth.user!.id)

  const mapped = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.created_at,
  }))

  return NextResponse.json({ notifications: mapped, unreadCount })
}

export async function PATCH(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()
  const supabase = await createServerSupabaseClient()

  if (body.markAllRead) {
    await markAllRead(auth.user!.id)
    return NextResponse.json({ ok: true })
  }

  if (body.notificationId) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", body.notificationId)
      .eq("user_id", auth.user!.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}
