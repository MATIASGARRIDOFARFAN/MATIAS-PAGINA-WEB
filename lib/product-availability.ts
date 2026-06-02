import { prisma } from "@/lib/prisma"
import type { ProductStatus } from "@/lib/types"

const TERMINAL_STATUSES: ProductStatus[] = ["vendido", "prestado", "intercambiado"]

export async function countActiveRequests(productId: string) {
  return prisma.materialRequest.count({
    where: {
      productId,
      status: { in: ["pendiente", "aceptada"] },
    },
  })
}

export function canRequestProduct(
  status: string,
  stock: number,
  activeRequests: number,
): boolean {
  if (stock <= 0) return false
  if (TERMINAL_STATUSES.includes(status as ProductStatus)) return false
  return activeRequests < stock
}

/** Ajusta status según stock y solicitudes activas (pendiente/aceptada). */
export async function syncProductAvailability(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, status: true },
  })
  if (!product) return

  if (TERMINAL_STATUSES.includes(product.status as ProductStatus)) return

  const active = await countActiveRequests(productId)
  const nextStatus: ProductStatus =
    product.stock > 0 && active < product.stock ? "disponible" : "reservado"

  if (product.status !== nextStatus) {
    await prisma.product.update({
      where: { id: productId },
      data: { status: nextStatus },
    })
  }
}
