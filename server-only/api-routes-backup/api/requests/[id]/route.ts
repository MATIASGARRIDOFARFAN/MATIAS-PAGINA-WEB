import { NextResponse } from "next/server"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createNotification } from "@/lib/notifications"
import { recordTransactionHistory } from "@/lib/history"
import { createServiceRoleClient } from "@/lib/supabase/server"
import type { ProductStatus } from "@/lib/types"

const STATUS_MAP: Record<string, ProductStatus> = {
  compra: "vendido",
  prestamo: "prestado",
  intercambio: "intercambiado",
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const body = await request.json()
  const action = String(body.action ?? "")
  const supabase = createServiceRoleClient()

  const { data: materialRequest } = await supabase
    .from("material_requests")
    .select("*, product:products(*), requester:profiles!material_requests_requester_id_fkey(name)")
    .eq("id", id)
    .single()

  if (!materialRequest) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  const isOwner = materialRequest.owner_id === auth.user!.id
  const isRequester = materialRequest.requester_id === auth.user!.id
  const product = materialRequest.product as { id: string; title: string }

  if (action === "accept" && isOwner) {
    if (materialRequest.status !== "pendiente") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 })
    }

    const { data: updated } = await supabase
      .from("material_requests")
      .update({ status: "aceptada" })
      .eq("id", id)
      .select()
      .single()

    await createNotification({
      userId: materialRequest.requester_id,
      type: "request_accepted",
      title: "Solicitud aceptada",
      body: `Tu solicitud de "${product.title}" fue aceptada.`,
      metadata: { requestId: id },
    })

    await getOrCreateConversation(materialRequest.requester_id, materialRequest.owner_id, materialRequest.product_id)

    return NextResponse.json({ request: updated })
  }

  if (action === "reject" && isOwner) {
    if (materialRequest.status !== "pendiente") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 })
    }

    const { data: updated } = await supabase
      .from("material_requests")
      .update({ status: "rechazada" })
      .eq("id", id)
      .select()
      .single()

    const { count } = await supabase
      .from("material_requests")
      .select("*", { count: "exact", head: true })
      .eq("product_id", materialRequest.product_id)
      .eq("status", "pendiente")

    if ((count ?? 0) === 0) {
      await supabase.from("products").update({ status: "disponible" }).eq("id", materialRequest.product_id)
    }

    await createNotification({
      userId: materialRequest.requester_id,
      type: "request_rejected",
      title: "Solicitud rechazada",
      body: `Tu solicitud de "${product.title}" fue rechazada.`,
      metadata: { requestId: id },
    })

    return NextResponse.json({ request: updated })
  }

  if (action === "complete" && (isOwner || isRequester)) {
    if (materialRequest.status !== "aceptada") {
      return NextResponse.json({ error: "Solo se pueden completar solicitudes aceptadas" }, { status: 400 })
    }

    const newProductStatus = STATUS_MAP[materialRequest.type] ?? "vendido"

    const { data: updated } = await supabase
      .from("material_requests")
      .update({ status: "completada" })
      .eq("id", id)
      .select()
      .single()

    await supabase.from("products").update({ status: newProductStatus }).eq("id", materialRequest.product_id)

    const historyType =
      materialRequest.type === "compra"
        ? "compra"
        : materialRequest.type === "prestamo"
          ? "prestamo"
          : "intercambio"

    await recordTransactionHistory(
      id,
      materialRequest.product_id,
      materialRequest.requester_id,
      materialRequest.owner_id,
      historyType,
    )

    const notifType = materialRequest.type === "prestamo" ? "loan_completed" : "purchase_completed"

    await createNotification({
      userId: materialRequest.requester_id,
      type: notifType,
      title: "Transacción completada",
      body: `Se completó la operación de "${product.title}". Puedes calificar al usuario.`,
      metadata: { requestId: id, canRate: true },
    })

    await createNotification({
      userId: materialRequest.owner_id,
      type: notifType,
      title: "Transacción completada",
      body: `Se completó la operación de "${product.title}". Puedes calificar al usuario.`,
      metadata: { requestId: id, canRate: true },
    })

    return NextResponse.json({ request: updated, canRate: true })
  }

  return NextResponse.json({ error: "Acción no permitida" }, { status: 403 })
}
