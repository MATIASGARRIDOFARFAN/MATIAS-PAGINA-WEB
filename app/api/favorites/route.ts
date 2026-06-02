import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getUserFavoriteProducts, toggleFavorite, isProductFavorited } from "@/lib/favorites"

export async function GET(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  if (productId) {
    const favorited = await isProductFavorited(auth.user!.id, productId)
    return NextResponse.json({ favorited })
  }

  const products = await getUserFavoriteProducts(auth.user!.id)
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const productId = String(body.productId ?? "")
    if (!productId) return NextResponse.json({ error: "productId requerido" }, { status: 400 })

    const result = await toggleFavorite(auth.user!.id, productId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Error al actualizar favorito" }, { status: 500 })
  }
}
