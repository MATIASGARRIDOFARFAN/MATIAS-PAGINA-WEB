import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getProductsBySellerId } from "@/lib/products-db"
import { normalizeAvatarUrl } from "@/lib/security"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id, suspended: false },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      bio: true,
      avatar: true,
      faculty: true,
      career: true,
      emailVerified: true,
      ratingAvg: true,
      ratingCount: true,
      profileViews: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  const session = await getSession()
  if (session?.id && session.id !== id) {
    await prisma.user.update({
      where: { id },
      data: { profileViews: { increment: 1 } },
    })
    user.profileViews += 1
  }

  const products = await getProductsBySellerId(id)

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      bio: user.bio,
      avatar: normalizeAvatarUrl(user.avatar) || user.avatar,
      faculty: user.faculty,
      career: user.career,
      verified: user.emailVerified,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      profileViews: user.profileViews,
      badges: user.emailVerified ? ["Estudiante Verificado"] : [],
    },
    products,
    stats: {
      views: products.reduce((sum, p) => sum + p.views, 0) + user.profileViews,
      listings: products.length,
      favorites: products.reduce((sum, p) => sum + p.favorites, 0),
    },
  })
}
