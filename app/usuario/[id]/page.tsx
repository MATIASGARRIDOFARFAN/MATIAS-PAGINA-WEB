import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PublicProfile } from "@/components/public-profile"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getProductsBySellerId } from "@/lib/products-db"
import { normalizeAvatarUrl } from "@/lib/security"

export const dynamic = "force-dynamic"

export default async function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (session?.id === id) {
    redirect("/perfil")
  }

  const user = await prisma.user.findUnique({
    where: { id, suspended: false },
    select: {
      id: true,
      name: true,
      bio: true,
      avatar: true,
      faculty: true,
      career: true,
      emailVerified: true,
      ratingAvg: true,
      ratingCount: true,
      profileViews: true,
    },
  })

  if (!user) notFound()

  if (session?.id) {
    await prisma.user.update({
      where: { id },
      data: { profileViews: { increment: 1 } },
    })
    user.profileViews += 1
  }

  const products = await getProductsBySellerId(id)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <PublicProfile
            user={{
              ...user,
              avatar: normalizeAvatarUrl(user.avatar) || user.avatar,
              verified: user.emailVerified,
              badges: user.emailVerified ? ["Estudiante Verificado"] : [],
            }}
            products={products}
            stats={{
              views: products.reduce((sum, p) => sum + p.views, 0) + user.profileViews,
              listings: products.length,
              favorites: products.reduce((sum, p) => sum + p.favorites, 0),
            }}
            isOwnProfile={false}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
