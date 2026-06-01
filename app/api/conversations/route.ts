import { NextResponse } from "next/server"
import { requireVerifiedAuth, getOrCreateConversation } from "@/lib/api-helpers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const supabase = await createServerSupabaseClient()
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(
      `
      id, product_id, participant1_id, participant2_id, updated_at,
      product:products(id, title),
      messages(content, created_at, sender_id)
    `,
    )
    .or(`participant1_id.eq.${auth.user!.id},participant2_id.eq.${auth.user!.id}`)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Error al cargar conversaciones" }, { status: 500 })
  }

  const participantIds = new Set<string>()
  for (const c of conversations ?? []) {
    participantIds.add(c.participant1_id)
    participantIds.add(c.participant2_id)
  }
  participantIds.delete(auth.user!.id)

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .in("id", [...participantIds])

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const result = (conversations ?? []).map((c) => {
    const otherId = c.participant1_id === auth.user!.id ? c.participant2_id : c.participant1_id
    const other = profileMap[otherId]
    const msgs = (c.messages as { content: string; created_at: string; sender_id: string }[]) ?? []
    const sorted = [...msgs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    const lastMsg = sorted[0]
    return {
      id: c.id,
      product: c.product,
      otherUser: other ? { id: other.id, name: other.name, avatar: other.avatar_url } : null,
      lastMessage: lastMsg
        ? { content: lastMsg.content, createdAt: lastMsg.created_at, senderId: lastMsg.sender_id }
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

  const conversation = await getOrCreateConversation(auth.user!.id, otherUserId, productId)
  return NextResponse.json({ conversationId: conversation.id })
}
