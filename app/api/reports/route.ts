import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { sanitizeText } from "@/lib/security"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const reason = sanitizeText(String(body.reason ?? ""), 1000)
    const targetUserId = body.targetUserId ? String(body.targetUserId) : null
    const targetProductId = body.targetProductId ? String(body.targetProductId) : null

    if (!reason) {
      return NextResponse.json({ error: "Describe el motivo del reporte" }, { status: 400 })
    }

    if (!targetUserId && !targetProductId) {
      return NextResponse.json({ error: "Indica qué deseas reportar" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: auth.user!.id,
        target_user_id: targetUserId,
        target_product_id: targetProductId,
        reason,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al enviar reporte" }, { status: 500 })
    }

    return NextResponse.json({ report }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al enviar reporte" }, { status: 500 })
  }
}
