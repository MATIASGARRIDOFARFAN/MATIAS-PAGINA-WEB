import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getFavoriteProducts } from "@/lib/products-db"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const products = await getFavoriteProducts(auth.user!.id)
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()
  const productId = String(body.productId ?? "")
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from("favorites").insert({
    user_id: auth.user!.id,
    product_id: productId,
  })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true })
    }
    return NextResponse.json({ error: "No se pudo guardar favorito" }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  if (!productId) {
    return NextResponse.json({ error: "productId requerido" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  await supabase.from("favorites").delete().eq("user_id", auth.user!.id).eq("product_id", productId)

  return NextResponse.json({ ok: true })
}
