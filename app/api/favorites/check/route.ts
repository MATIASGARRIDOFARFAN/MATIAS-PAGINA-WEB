import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", auth.user!.id)
    .eq("product_id", productId)
    .maybeSingle()

  return NextResponse.json({ favorited: !!data })
}
