import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProfileContent } from "@/components/profile-content"
import { getSession } from "@/lib/auth"
import { getProductsBySellerId } from "@/lib/products-db"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { mapProfile } from "@/lib/supabase/types"

export const metadata = {
  title: "Mi perfil · USMP Market",
}

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login?redirect=/perfil")

  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.id).single()

  if (!profile) redirect("/login?redirect=/perfil")

  const user = mapProfile(profile)
  const products = await getProductsBySellerId(user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <ProfileContent
            user={{
              ...user,
              verified: true,
              badges: ["Estudiante Verificado"],
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
