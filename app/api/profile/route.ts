import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getProductsBySellerId } from "@/lib/products-db"
import { sanitizeText, sanitizeOptional } from "@/lib/security"
import { fullName } from "@/lib/types"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const products = await getProductsBySellerId(auth.user!.id)

  return NextResponse.json({
    user: {
      id: auth.user!.id,
      firstName: auth.user!.firstName,
      lastName: auth.user!.lastName,
      name: auth.user!.name,
      email: auth.user!.email,
      bio: auth.user!.bio,
      avatar: auth.user!.avatar,
      phone: auth.user!.phone,
      faculty: auth.user!.faculty,
      career: auth.user!.career,
      verified: auth.user!.emailVerified,
      ratingAvg: auth.user!.ratingAvg,
      ratingCount: auth.user!.ratingCount,
      role: auth.user!.role,
      badges: auth.user!.emailVerified ? ["Estudiante Verificado"] : [],
    },
    products,
    stats: {
      views: products.reduce((sum, p) => sum + p.views, 0),
      listings: products.length,
      favorites: products.reduce((sum, p) => sum + p.favorites, 0),
    },
  })
}

export async function PATCH(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const firstName = body.firstName != null ? sanitizeText(String(body.firstName), 100) : undefined
    const lastName = body.lastName != null ? sanitizeText(String(body.lastName), 100) : undefined
    const bio = body.bio !== undefined ? sanitizeOptional(body.bio, 500) : undefined
    const avatar = body.avatar != null ? sanitizeText(String(body.avatar), 500) : undefined
    const phone = body.phone !== undefined ? sanitizeOptional(body.phone, 20) : undefined

    const updated = await prisma.user.update({
      where: { id: auth.user!.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(firstName !== undefined || lastName !== undefined
          ? {
              name: fullName(
                firstName ?? auth.user!.firstName,
                lastName ?? auth.user!.lastName,
              ),
            }
          : {}),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        phone: true,
        faculty: true,
        career: true,
        ratingAvg: true,
        ratingCount: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}
