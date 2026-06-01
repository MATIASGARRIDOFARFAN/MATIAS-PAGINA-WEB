import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { filterMessageContent } from "@/lib/message-filter"
import { sanitizeText } from "@/lib/security"
import { createNotification } from "@/lib/notifications"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).single()
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const isParticipant =
    conversation.participant1_id === auth.user!.id ||
    conversation.participant2_id === auth.user!.id
  if (!isParticipant) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { data: messages } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url)")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  const mapped = (messages ?? []).map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.created_at,
    senderId: m.sender_id,
    filtered: m.filtered,
    filterReason: m.filter_reason,
    sender: m.sender
      ? { id: m.sender.id, name: m.sender.name, avatar: m.sender.avatar_url }
      : null,
  }))

  return NextResponse.json({ messages: mapped })
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

  const supabase = await createServerSupabaseClient()
  const { data: conversation } = await supabase.from("conversations").select("*").eq("id", id).single()
  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 })

  const isParticipant =
    conversation.participant1_id === auth.user!.id ||
    conversation.participant2_id === auth.user!.id
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

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      sender_id: auth.user!.id,
      content: filter.filtered,
      filtered: filter.warnings.length > 0,
      filter_reason: filter.warnings.join("; ") || null,
    })
    .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url)")
    .single()

  if (error) {
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 })
  }

  const recipientId =
    conversation.participant1_id === auth.user!.id
      ? conversation.participant2_id
      : conversation.participant1_id

  await createNotification({
    userId: recipientId,
    type: "message_received",
    title: "Nuevo mensaje",
    body: `${auth.user!.name}: ${filter.filtered.slice(0, 80)}`,
    metadata: { conversationId: id },
  })

  return NextResponse.json({
    message: {
      id: message.id,
      content: message.content,
      createdAt: message.created_at,
      senderId: message.sender_id,
      filtered: message.filtered,
      filterReason: message.filter_reason,
      sender: message.sender
        ? { id: message.sender.id, name: message.sender.name, avatar: message.sender.avatar_url }
        : null,
    },
    warnings: filter.warnings,
  })
}
