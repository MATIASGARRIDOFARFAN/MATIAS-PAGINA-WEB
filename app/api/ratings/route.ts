import { NextResponse } from "next/server"
import { requireVerifiedAuth, updateUserRating } from "@/lib/api-helpers"
import { sanitizeOptional, clampStars } from "@/lib/security"
import { createNotification } from "@/lib/notifications"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const requestId = body.requestId ? String(body.requestId) : null
    const toUserId = body.toUserId ? String(body.toUserId) : null
    const productId = body.productId ? String(body.productId) : null
    const stars = clampStars(Number(body.stars))
    const comment = sanitizeOptional(body.comment, 500)

    const supabase = await createServerSupabaseClient()

    if (toUserId) {
      if (toUserId === auth.user!.id) {
        return NextResponse.json({ error: "No puedes calificarte a ti mismo" }, { status: 400 })
      }

      if (requestId) {
        const { data: existing } = await supabase
          .from("user_ratings")
          .select("id")
          .eq("from_user_id", auth.user!.id)
          .eq("request_id", requestId)
          .maybeSingle()
        if (existing) {
          return NextResponse.json({ error: "Ya calificaste esta transacción" }, { status: 409 })
        }
      }

      const { data: rating, error } = await supabase
        .from("user_ratings")
        .insert({
          from_user_id: auth.user!.id,
          to_user_id: toUserId,
          request_id: requestId,
          stars,
          comment,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: "Error al guardar calificación" }, { status: 500 })

      await updateUserRating(toUserId)

      await createNotification({
        userId: toUserId,
        type: "rating_received",
        title: "Nueva calificación",
        body: `${auth.user!.name} te calificó con ${stars} estrellas.`,
        metadata: { ratingId: rating.id },
      })

      return NextResponse.json({ rating })
    }

    if (productId) {
      if (requestId) {
        const { data: existing } = await supabase
          .from("product_ratings")
          .select("id")
          .eq("from_user_id", auth.user!.id)
          .eq("request_id", requestId)
          .eq("product_id", productId)
          .maybeSingle()
        if (existing) {
          return NextResponse.json({ error: "Ya calificaste este material" }, { status: 409 })
        }
      }

      const { data: rating, error } = await supabase
        .from("product_ratings")
        .insert({
          from_user_id: auth.user!.id,
          product_id: productId,
          request_id: requestId,
          stars,
          comment,
        })
        .select()
        .single()

      if (error) return NextResponse.json({ error: "Error al guardar calificación" }, { status: 500 })
      return NextResponse.json({ rating })
    }

    return NextResponse.json({ error: "Indica usuario o producto a calificar" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Error al guardar calificación" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const productId = searchParams.get("productId")
  const supabase = await createServerSupabaseClient()

  if (userId) {
    const { data: ratings } = await supabase
      .from("user_ratings")
      .select("*, from_user:profiles!user_ratings_from_user_id_fkey(name, avatar_url)")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    const { data: user } = await supabase
      .from("profiles")
      .select("rating_avg, rating_count")
      .eq("id", userId)
      .single()

    return NextResponse.json({
      ratings,
      average: user?.rating_avg ?? 0,
      count: user?.rating_count ?? 0,
    })
  }

  if (productId) {
    const { data: ratings } = await supabase
      .from("product_ratings")
      .select("*, from_user:profiles!product_ratings_from_user_id_fkey(name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(20)

    const stars = ratings?.map((r) => r.stars) ?? []
    const count = stars.length
    const average = count > 0 ? stars.reduce((a, b) => a + b, 0) / count : 0

    return NextResponse.json({ ratings, average, count })
  }

  return NextResponse.json({ error: "Parámetro requerido" }, { status: 400 })
}
