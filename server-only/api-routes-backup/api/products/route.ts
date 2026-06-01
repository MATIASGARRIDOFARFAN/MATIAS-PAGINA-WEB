import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getAllProducts, mapDbProduct } from "@/lib/products-db"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sanitizeText } from "@/lib/security"
import type { DbProduct, DbProfile } from "@/lib/supabase/types"

const PRODUCT_SELECT = `
  *,
  seller:profiles!products_seller_id_fkey (
    id, email, first_name, last_name, name, avatar_url, faculty, career,
    role, suspended, rating_avg, rating_count
  )
`

export async function GET() {
  try {
    const products = await getAllProducts()
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ error: "Error al cargar productos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()

    const title = sanitizeText(String(body.title ?? ""), 200)
    const description = sanitizeText(String(body.description ?? ""), 3000)
    const category = String(body.category ?? "")
    const faculty = String(body.faculty ?? "")
    const career = String(body.career ?? "")
    const course = String(body.course ?? "")
    const condition = String(body.condition ?? "")
    const transaction = String(body.transaction ?? "")
    const location = sanitizeText(String(body.location ?? ""), 200)
    const price = Number(body.price ?? 0)
    const stock = Number(body.stock ?? 1)
    const images: string[] = Array.isArray(body.images) ? body.images : ["/placeholder.svg"]

    if (!title || !description || !category || !faculty || !career || !course) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios" }, { status: 400 })
    }

    if (!condition || !transaction || !location) {
      return NextResponse.json({ error: "Completa estado, transacción y punto de entrega" }, { status: 400 })
    }

    if (transaction !== "intercambio" && price <= 0) {
      return NextResponse.json({ error: "Indica un precio válido para venta" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        title,
        description,
        price: transaction === "intercambio" ? 0 : price,
        images,
        category,
        faculty,
        career,
        course,
        condition,
        transaction,
        location,
        stock: Math.max(1, stock),
        seller_id: auth.user!.id,
        status: "disponible",
      })
      .select(PRODUCT_SELECT)
      .single()

    if (error) {
      console.error("create product error:", error)
      return NextResponse.json({ error: "Error al publicar el producto" }, { status: 500 })
    }

    await supabase.from("profiles").update({ faculty, career }).eq("id", auth.user!.id)

    return NextResponse.json(
      { product: mapDbProduct(product as DbProduct & { seller: DbProfile }) },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: "Error al publicar el producto" }, { status: 500 })
  }
}
