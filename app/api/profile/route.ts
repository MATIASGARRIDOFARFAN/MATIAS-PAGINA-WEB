import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getProductsBySellerId } from "@/lib/products-db"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sanitizeText, sanitizeOptional } from "@/lib/security"

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
      verified: true,
      ratingAvg: auth.user!.ratingAvg,
      ratingCount: auth.user!.ratingCount,
      role: auth.user!.role,
      badges: ["Estudiante Verificado"],
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
    const updates: Record<string, unknown> = {}

    if (body.firstName != null) updates.first_name = sanitizeText(String(body.firstName), 100)
    if (body.lastName != null) updates.last_name = sanitizeText(String(body.lastName), 100)
    if (body.bio !== undefined) updates.bio = sanitizeOptional(body.bio, 500)
    if (body.avatar != null) updates.avatar_url = sanitizeText(String(body.avatar), 500)
    if (body.phone !== undefined) updates.phone = sanitizeOptional(body.phone, 20)

    if (updates.first_name || updates.last_name) {
      const fn = (updates.first_name as string) ?? auth.user!.firstName
      const ln = (updates.last_name as string) ?? auth.user!.lastName
      updates.name = `${fn} ${ln}`.trim()
    }

    const supabase = await createServerSupabaseClient()
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", auth.user!.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        avatar: updated.avatar_url,
        phone: updated.phone,
        faculty: updated.faculty,
        career: updated.career,
        ratingAvg: updated.rating_avg,
        ratingCount: updated.rating_count,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}
