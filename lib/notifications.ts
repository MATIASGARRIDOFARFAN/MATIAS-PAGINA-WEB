import { createServiceRoleClient } from "@/lib/supabase/server"
import type { NOTIFICATION_TYPES } from "@/lib/types"

type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

interface NotifyOptions {
  userId: string
  type: NotificationType | string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export async function createNotification(opts: NotifyOptions) {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      metadata: opts.metadata ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("createNotification error:", error)
    return null
  }
  return data
}

export async function getUnreadCount(userId: string) {
  const supabase = createServiceRoleClient()
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)
  return count ?? 0
}

export async function markAllRead(userId: string) {
  const supabase = createServiceRoleClient()
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)
}

export async function getUserNotifications(userId: string, limit = 50) {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}
