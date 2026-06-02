import { prisma } from "@/lib/prisma"
import { mapDbProduct } from "@/lib/products-db"

export async function getUserFavoriteProducts(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    include: { product: { include: { seller: true } } },
    orderBy: { createdAt: "desc" },
  })
  return rows.map((f) => mapDbProduct(f.product))
}

export async function isProductFavorited(userId: string, productId: string) {
  const row = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  })
  return !!row
}

export async function toggleFavorite(userId: string, productId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  })

  if (existing) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { favorites: true } })
    await prisma.$transaction([
      prisma.favorite.delete({ where: { id: existing.id } }),
      ...(product && product.favorites > 0
        ? [
            prisma.product.update({
              where: { id: productId },
              data: { favorites: { decrement: 1 } },
            }),
          ]
        : []),
    ])
    return { favorited: false }
  }

  await prisma.$transaction([
    prisma.favorite.create({ data: { userId, productId } }),
    prisma.product.update({
      where: { id: productId },
      data: { favorites: { increment: 1 } },
    }),
  ])
  return { favorited: true }
}
