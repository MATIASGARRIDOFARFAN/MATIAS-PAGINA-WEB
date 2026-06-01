import { NextResponse } from "next/server"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { recordRequestHistory } from "@/lib/history"
import { canRequestProduct } from "@/lib/types"
import { filterMessageContent } from "@/lib/message-filter"
import { sanitizeText } from "@/lib/security"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const supabase = await createServerSupabaseClient()

  const [sentRes, receivedRes] = await Promise.all([
    supabase
      .from("material_requests")
      .select(
        `*, product:products(id, title, images, status),
         owner:profiles!material_requests_owner_id_fkey(id, name, avatar_url)`,
      )
      .eq("requester_id", auth.user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("material_requests")
      .select(
        `*, product:products(id, title, images, status),
         requester:profiles!material_requests_requester_id_fkey(id, name, avatar_url)`,
      )
      .eq("owner_id", auth.user!.id)
      .order("created_at", { ascending: false }),
  ])

  const mapRow = (r: Record<string, unknown>, otherKey: string) => ({
    ...r,
    product: r.product,
    [otherKey === "owner" ? "owner" : "requester"]: r[otherKey]
      ? { ...(r[otherKey] as object), avatar: (r[otherKey] as { avatar_url: string }).avatar_url }
      : null,
  })

  return NextResponse.json({
    sent: (sentRes.data ?? []).map((r) => mapRow(r, "owner")),
    received: (receivedRes.data ?? []).map((r) => mapRow(r, "requester")),
  })
}

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const productId = String(body.productId ?? "")
    const type = String(body.type ?? "compra") as "compra" | "prestamo" | "intercambio"
    let message = sanitizeText(String(body.message ?? ""), 1000)

    const filter = filterMessageContent(message)
    if (filter.blocked) {
      return NextResponse.json(
        { error: filter.warnings.join(" "), warnings: filter.warnings },
        { status: 400 },
      )
    }
    message = filter.filtered

    const supabase = await createServerSupabaseClient()
    const { data: product } = await supabase.from("products").select("*").eq("id", productId).single()

    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    if (product.seller_id === auth.user!.id) {
      return NextResponse.json({ error: "No puedes solicitar tu propio material" }, { status: 400 })
    }
    if (!canRequestProduct(product.status)) {
      return NextResponse.json({ error: "Este material ya no acepta solicitudes" }, { status: 400 })
    }

    const { data: materialRequest, error } = await supabase
      .from("material_requests")
      .insert({
        product_id: productId,
        requester_id: auth.user!.id,
        owner_id: product.seller_id,
        type,
        message,
        status: "pendiente",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 })
    }

    await supabase.from("products").update({ status: "reservado" }).eq("id", productId)

    await recordRequestHistory(
      materialRequest.id,
      productId,
      auth.user!.id,
      product.seller_id,
      type,
      "pendiente",
    )

    await createNotification({
      userId: product.seller_id,
      type: "request_received",
      title: "Nueva solicitud de material",
      body: `${auth.user!.name} solicitó "${product.title}" (${type}).`,
      metadata: { requestId: materialRequest.id, productId },
    })

    await getOrCreateConversation(auth.user!.id, product.seller_id, productId)

    return NextResponse.json({ request: materialRequest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 })
  }
}
