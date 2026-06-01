import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProductById, mapDbProduct } from "@/lib/products-db"

async function getOwnedProduct(id: string, userId: string) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return { error: "Producto no encontrado", status: 404 as const }
  if (product.sellerId !== userId) {
    return { error: "No puedes modificar esta publicación", status: 403 as const }
  }
  return { product }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }
  return NextResponse.json({ product })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })
  }

  const { id } = await params
  const owned = await getOwnedProduct(id, session.id)
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status })
  }

  try {
    const body = await request.json()
    const title = String(body.title ?? owned.product.title).trim()
    const description = String(body.description ?? owned.product.description).trim()
    const category = String(body.category ?? owned.product.category)
    const faculty = String(body.faculty ?? owned.product.faculty)
    const career = String(body.career ?? owned.product.career)
    const course = String(body.course ?? owned.product.course)
    const condition = String(body.condition ?? owned.product.condition)
    const transaction = String(body.transaction ?? owned.product.transaction)
    const location = String(body.location ?? owned.product.location)
    const price = Number(body.price ?? owned.product.price)
    const stock = Number(body.stock ?? owned.product.stock)
    const whatsapp = body.whatsapp != null ? String(body.whatsapp).trim() : null

    if (!title || !description) {
      return NextResponse.json({ error: "Título y descripción son obligatorios" }, { status: 400 })
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        description,
        category,
        faculty,
        career,
        course,
        condition,
        transaction,
        location,
        price: transaction === "intercambio" ? 0 : price,
        stock: Math.max(1, stock),
        whatsapp: whatsapp || null,
      },
      include: { seller: true },
    })

    await prisma.user.update({
      where: { id: session.id },
      data: { faculty, career },
    })

    return NextResponse.json({ product: mapDbProduct(updated) })
  } catch {
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })
  }

  const { id } = await params
  const owned = await getOwnedProduct(id, session.id)
  if ("error" in owned) {
    return NextResponse.json({ error: owned.error }, { status: owned.status })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
