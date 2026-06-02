import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { sanitizeText } from "@/lib/security"
import { createNotification } from "@/lib/notifications"
import { recordRequestHistory } from "@/lib/history"
import { canRequestProduct, countActiveRequests, syncProductAvailability } from "@/lib/product-availability"
import { filterMessageContent } from "@/lib/message-filter"
import { getOrCreateConversation } from "@/lib/api-helpers"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const [sent, received] = await Promise.all([
    prisma.materialRequest.findMany({
      where: { requesterId: auth.user!.id },
      include: {
        product: { select: { id: true, title: true, images: true, status: true } },
        owner: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.materialRequest.findMany({
      where: { ownerId: auth.user!.id },
      include: {
        product: { select: { id: true, title: true, images: true, status: true } },
        requester: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({ sent, received })
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

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    if (product.sellerId === auth.user!.id) {
      return NextResponse.json({ error: "No puedes solicitar tu propio material" }, { status: 400 })
    }
    const activeRequests = await countActiveRequests(productId)
    if (!canRequestProduct(product.status, product.stock, activeRequests)) {
      return NextResponse.json({ error: "Este material ya no acepta solicitudes" }, { status: 400 })
    }

    const materialRequest = await prisma.materialRequest.create({
      data: {
        productId,
        requesterId: auth.user!.id,
        ownerId: product.sellerId,
        type,
        message,
        status: "pendiente",
      },
    })

    await syncProductAvailability(productId)

    await recordRequestHistory(
      materialRequest.id,
      productId,
      auth.user!.id,
      product.sellerId,
      type,
      "pendiente",
    )

    const conversation = await getOrCreateConversation(auth.user!.id, product.sellerId, productId)

    await createNotification({
      userId: product.sellerId,
      type: "request_received",
      title: "Nueva solicitud de material",
      body: `${auth.user!.name} solicitó "${product.title}" (${type}).`,
      metadata: {
        requestId: materialRequest.id,
        productId,
        otherUserId: auth.user!.id,
        conversationId: conversation.id,
      },
    })

    return NextResponse.json({ request: materialRequest }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 })
  }
}
