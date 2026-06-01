import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { filterMessageContent } from "@/lib/message-filter"
import { sanitizeText } from "@/lib/security"
import { createNotification } from "@/lib/notifications"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params

  const conversation = await prisma.conversation.findUnique({ where: { id } })
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const isParticipant =
    conversation.participant1Id === auth.user!.id ||
    conversation.participant2Id === auth.user!.id
  if (!isParticipant) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  })

  return NextResponse.json({ messages })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const body = await request.json()
  const rawContent = sanitizeText(String(body.content ?? ""), 2000)

  if (!rawContent) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 })
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } })
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const isParticipant =
    conversation.participant1Id === auth.user!.id ||
    conversation.participant2Id === auth.user!.id
  if (!isParticipant) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const filter = filterMessageContent(rawContent)

  if (filter.blocked || !filter.allowed) {
    return NextResponse.json(
      {
        error: "Mensaje bloqueado por políticas de seguridad",
        warnings: filter.warnings,
        blocked: true,
      },
      { status: 400 },
    )
  }

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: auth.user!.id,
      content: filter.filtered,
      filtered: filter.warnings.length > 0,
      filterReason: filter.warnings.join("; ") || null,
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  })

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } })

  const recipientId =
    conversation.participant1Id === auth.user!.id
      ? conversation.participant2Id
      : conversation.participant1Id

  await createNotification({
    userId: recipientId,
    type: "message_received",
    title: "Nuevo mensaje",
    body: `${auth.user!.name}: ${filter.filtered.slice(0, 80)}`,
    metadata: { conversationId: id },
  })

  return NextResponse.json({
    message,
    warnings: filter.warnings,
  })
}
