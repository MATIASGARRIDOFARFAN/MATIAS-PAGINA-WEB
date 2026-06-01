import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participant1Id: auth.user!.id }, { participant2Id: auth.user!.id }],
    },
    include: {
      product: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      participant1: { select: { id: true, name: true, avatar: true } },
      participant2: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const result = conversations.map((c) => {
    const other =
      c.participant1Id === auth.user!.id ? c.participant2 : c.participant1
    const lastMsg = c.messages[0]
    return {
      id: c.id,
      product: c.product,
      otherUser: other,
      lastMessage: lastMsg
        ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
        : null,
    }
  })

  return NextResponse.json({ conversations: result })
}

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()
  const otherUserId = String(body.otherUserId ?? "")
  const productId = body.productId ? String(body.productId) : undefined

  if (!otherUserId || otherUserId === auth.user!.id) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 400 })
  }

  const { getOrCreateConversation } = await import("@/lib/api-helpers")
  const conversation = await getOrCreateConversation(auth.user!.id, otherUserId, productId)

  return NextResponse.json({ conversationId: conversation.id })
}
