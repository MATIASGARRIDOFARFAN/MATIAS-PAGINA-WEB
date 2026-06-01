import type { Product, Seller, TransactionType, Condition, MaterialStatus } from "@/lib/data"
import type { Product as DbProduct, User } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type ProductWithSeller = DbProduct & { seller: User }

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["/placeholder.svg"]
  } catch {
    return ["/placeholder.svg"]
  }
}

export function mapDbProduct(row: ProductWithSeller): Product {
  const seller: Seller = {
    id: row.seller.id,
    name: row.seller.name,
    email: row.seller.email,
    avatar: row.seller.avatar,
    faculty: row.seller.faculty ?? row.faculty,
    career: row.seller.career ?? row.career,
    verified: row.seller.verified,
    rating: row.seller.ratingAvg || 4.8,
    sales: 0,
    exchanges: 0,
    listings: 0,
    badges: row.seller.verified ? ["Estudiante Verificado"] : [],
  }

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
  return row ? mapDbProduct(row) : null
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
