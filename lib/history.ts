import { createServiceRoleClient } from "@/lib/supabase/server"
import type { RequestType } from "@/lib/types"

export async function addHistoryEntry(data: {
  userId: string
  relatedUserId?: string
  productId?: string
  requestId?: string
  type: string
  status: string
}) {
  const supabase = createServiceRoleClient()
  const { data: entry, error } = await supabase
    .from("history_entries")
    .insert({
      user_id: data.userId,
      related_user_id: data.relatedUserId ?? null,
      product_id: data.productId ?? null,
      request_id: data.requestId ?? null,
      type: data.type,
      status: data.status,
    })
    .select()
    .single()
  if (error) throw error
  return entry
}

export async function getUserHistory(userId: string) {
  const supabase = createServiceRoleClient()

  const { data: entries, error } = await supabase
    .from("history_entries")
    .select("id, type, status, created_at, related_user_id, product_id, products(id, title, images)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !entries) return []

  const userIds = [...new Set(entries.map((e) => e.related_user_id).filter(Boolean))] as string[]
  let userMap: Record<string, { id: string; name: string; avatar: string }> = {}

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", userIds)
    userMap = Object.fromEntries(
      (users ?? []).map((u) => [u.id, { id: u.id, name: u.name, avatar: u.avatar_url }]),
    )
  }

  return entries.map((e) => {
    const product = e.products as { id: string; title: string; images: string[] | string } | null
    let image: string | undefined
    if (product?.images) {
      const imgs = Array.isArray(product.images) ? product.images : JSON.parse(String(product.images))
      image = imgs[0]
    }
    return {
      id: e.id,
      type: e.type,
      status: e.status,
      createdAt: e.created_at,
      product: product ? { id: product.id, title: product.title, image } : null,
      relatedUser: e.related_user_id ? userMap[e.related_user_id] ?? null : null,
    }
  })
}

export async function recordRequestHistory(
  requestId: string,
  productId: string,
  requesterId: string,
  ownerId: string,
  _type: RequestType,
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
