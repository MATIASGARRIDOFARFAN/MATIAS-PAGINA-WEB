import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getAllProducts, mapDbProduct } from "@/lib/products-db"
import { sanitizeText } from "@/lib/security"

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

    if (!title || !description || !category) {
      return NextResponse.json({ error: "Completa título, descripción y categoría" }, { status: 400 })
    }

    if (!condition || !transaction || !location) {
      return NextResponse.json({ error: "Completa estado, transacción y punto de entrega" }, { status: 400 })
    }

    if (transaction !== "intercambio" && transaction !== "prestamo" && price <= 0) {
      return NextResponse.json({ error: "Indica un precio válido para venta" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: transaction === "intercambio" || transaction === "prestamo" ? 0 : price,
        images: JSON.stringify(images),
        category,
        faculty,
        career,
        course,
        condition,
        transaction,
        location,
        stock: Math.max(1, stock),
        sellerId: auth.user!.id,
        status: "disponible",
      },
      include: { seller: true },
    })

    if (faculty || career) {
      await prisma.user.update({
        where: { id: auth.user!.id },
        data: {
          ...(faculty && { faculty }),
          ...(career && { career }),
        },
      })
    }

    return NextResponse.json({ product: mapDbProduct(product) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al publicar el producto" }, { status: 500 })
  }
}
