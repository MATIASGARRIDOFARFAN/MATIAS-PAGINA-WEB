import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileContent } from "@/components/profile-content"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProductsBySellerId } from "@/lib/products-db"
import { normalizeAvatarUrl } from "@/lib/security"

export const metadata = {
  title: "Mi perfil · USMP Market",
}

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login?redirect=/perfil")

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      bio: true,
      phone: true,
      faculty: true,
      career: true,
      avatar: true,
      emailVerified: true,
      ratingAvg: true,
      ratingCount: true,
    },
  })

  if (!user) redirect("/login?redirect=/perfil")

  const products = await getProductsBySellerId(user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ProfileContent
            user={{
              ...user,
              avatar: normalizeAvatarUrl(user.avatar) || user.avatar,
              verified: user.emailVerified,
              badges: user.emailVerified ? ["Estudiante Verificado"] : [],
            }}
            initialProducts={products}
            stats={{
              views: products.reduce((sum, p) => sum + p.views, 0),
              listings: products.length,
              favorites: products.reduce((sum, p) => sum + p.favorites, 0),
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
