import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getProductById, mapDbProduct, incrementProductViews } from "@/lib/products-db"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DbProduct, DbProfile } from "@/lib/supabase/types"

const PRODUCT_SELECT = `
  *,
  seller:profiles!products_seller_id_fkey (
    id, email, first_name, last_name, name, avatar_url, faculty, career,
    role, suspended, rating_avg, rating_count
  )
`

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }
  await incrementProductViews(id)
  return NextResponse.json({ product })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase.from("products").select("*").eq("id", id).single()
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  if (existing.seller_id !== auth.user!.id) {
    return NextResponse.json({ error: "No puedes modificar esta publicación" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const transaction = String(body.transaction ?? existing.transaction)
    const price = Number(body.price ?? existing.price)

    const { data: updated, error } = await supabase
      .from("products")
      .update({
        title: String(body.title ?? existing.title).trim(),
        description: String(body.description ?? existing.description).trim(),
        category: String(body.category ?? existing.category),
        faculty: String(body.faculty ?? existing.faculty),
        career: String(body.career ?? existing.career),
        course: String(body.course ?? existing.course),
        condition: String(body.condition ?? existing.condition),
        transaction,
        location: String(body.location ?? existing.location),
        price: transaction === "intercambio" ? 0 : price,
        stock: Math.max(1, Number(body.stock ?? existing.stock)),
        ...(Array.isArray(body.images) && { images: body.images }),
      })
      .eq("id", id)
      .select(PRODUCT_SELECT)
      .single()

    if (error) return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })

    await supabase
      .from("profiles")
      .update({ faculty: updated.faculty, career: updated.career })
      .eq("id", auth.user!.id)

    return NextResponse.json({ product: mapDbProduct(updated as DbProduct & { seller: DbProfile }) })
  } catch {
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: existing } = await supabase.from("products").select("seller_id").eq("id", id).single()
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  if (existing.seller_id !== auth.user!.id) {
    return NextResponse.json({ error: "No puedes eliminar esta publicación" }, { status: 403 })
  }

  await supabase.from("products").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
