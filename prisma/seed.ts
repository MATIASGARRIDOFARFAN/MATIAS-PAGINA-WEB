import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { products as seedProducts } from "../lib/data"
import { fullName } from "../lib/types"

const prisma = new PrismaClient()

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] ?? name, lastName: parts.slice(1).join(" ") || (parts[0] ?? name) }
}

async function main() {
  const passwordHash = await bcrypt.hash("usmp12345", 12)
  const adminHash = await bcrypt.hash("admin12345", 12)

  await prisma.user.upsert({
    where: { email: "admin@usmp.pe" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "USMP",
      name: "Admin USMP",
      email: "admin@usmp.pe",
      passwordHash: adminHash,
      emailVerified: true,
      role: "admin",
    },
  })

  const sellerMap = new Map<string, string>()

  for (const product of seedProducts) {
    const email = product.seller.email.toLowerCase()
    if (!sellerMap.has(email)) {
      const { firstName, lastName } = splitName(product.seller.name)
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          firstName,
          lastName,
          name: fullName(firstName, lastName),
          email,
          passwordHash,
          faculty: product.seller.faculty,
          career: product.seller.career,
          avatar: product.seller.avatar,
          emailVerified: true,
          ratingAvg: product.seller.rating,
          ratingCount: 5,
        },
      })
      sellerMap.set(email, user.id)
    }
  }

  for (const product of seedProducts) {
    const sellerId = sellerMap.get(product.seller.email.toLowerCase())
    if (!sellerId) continue

    const existing = await prisma.product.findFirst({
      where: { title: product.title, sellerId },
    })
    if (existing) continue

    const status =
      product.status === "prestado"
        ? "prestado"
        : product.status === "intercambiado"
          ? "intercambiado"
          : "disponible"

    await prisma.product.create({
      data: {
        title: product.title,
        description: product.description,
        price: product.price,
        images: JSON.stringify(product.images),
        category: product.category,
        faculty: product.faculty,
        career: product.career,
        course: product.course,
        condition: product.condition,
        transaction: product.transaction,
        status,
        stock: product.stock,
        location: product.location,
        views: product.views,
        favorites: product.favorites,
        featured: product.featured,
        sellerId,
        createdAt: new Date(product.createdAt),
      },
    })
  }

  console.log("Base de datos inicializada.")
  console.log("Admin: admin@usmp.pe / admin12345")
  console.log("Demo: crojas@usmp.pe / usmp12345")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
