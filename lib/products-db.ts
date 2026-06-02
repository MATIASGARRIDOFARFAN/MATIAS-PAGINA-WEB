import type { Product, Seller, TransactionType, Condition, MaterialStatus } from "@/lib/data"
import type { Product as DbProduct, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { normalizeAvatarUrl } from "@/lib/security"

type ProductWithSeller = DbProduct & { seller: User }

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["/placeholder.svg"]
  } catch {
    return ["/placeholder.svg"]
  }
}

function mapSellerBase(row: User, productRow?: DbProduct): Seller {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: normalizeAvatarUrl(row.avatar) || row.avatar,
    faculty: row.faculty ?? productRow?.faculty ?? "",
    career: row.career ?? productRow?.career ?? "",
    verified: row.emailVerified,
    rating: row.ratingAvg,
    ratingCount: row.ratingCount,
    sales: 0,
    exchanges: 0,
    listings: 0,
    badges: row.emailVerified ? ["Estudiante Verificado"] : [],
  }
}

export async function enrichSellerStats(sellerId: string, base: Seller): Promise<Seller> {
  const [listings, sales, exchanges] = await Promise.all([
    prisma.product.count({ where: { sellerId } }),
    prisma.materialRequest.count({
      where: { ownerId: sellerId, type: "compra", status: "completada" },
    }),
    prisma.materialRequest.count({
      where: {
        status: "completada",
        type: "intercambio",
        OR: [{ ownerId: sellerId }, { requesterId: sellerId }],
      },
    }),
  ])
  return { ...base, listings, sales, exchanges }
}

export function mapDbProduct(row: ProductWithSeller): Product {
  const seller = mapSellerBase(row.seller, row)

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    images: parseImages(row.images),
    category: row.category,
    faculty: row.faculty,
    career: row.career,
    course: row.course,
    condition: row.condition as Condition,
    transaction: row.transaction as TransactionType,
    status: row.status as MaterialStatus,
    stock: row.stock,
    location: row.location,
    views: row.views,
    favorites: row.favorites,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    featured: row.featured,
    seller,
  }
}

export async function incrementProductViews(id: string) {
  await prisma.product.update({
    where: { id },
    data: { views: { increment: 1 } },
  })
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapDbProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: { seller: true },
  })
  if (!row) return null
  const product = mapDbProduct(row)
  product.seller = await enrichSellerStats(row.sellerId, product.seller)
  return product
}

export async function getProductsBySellerId(sellerId: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { sellerId },
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapDbProduct)
}

export async function getRelatedProducts(current: Product, limit = 4): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      id: { not: current.id },
      OR: [{ career: current.career }, { category: current.category }],
    },
    include: { seller: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  })
  return rows.map(mapDbProduct)
}
