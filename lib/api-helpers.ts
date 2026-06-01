import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server"
import { mapProfile, type AppUser } from "@/lib/supabase/types"
import type { User } from "@supabase/supabase-js"

export async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "No autenticado", status: 401 as const, session: null, user: null as AppUser | null }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { error: "Usuario no encontrado", status: 404 as const, session: user, user: null as AppUser | null }
  }

  if (profile.suspended) {
    return { error: "Cuenta suspendida", status: 403 as const, session: user, user: null as AppUser | null }
  }

  return { session: user, user: mapProfile(profile), error: null, status: null }
}

export async function requireVerifiedAuth() {
  return requireAuth()
}

export async function requireAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user!.role !== "admin") {
    return { error: "Acceso denegado", status: 403 as const, session: result.session, user: result.user }
  }
  return result
}

export async function getOrCreateConversation(userId: string, otherUserId: string, productId?: string) {
  const supabase = createServiceRoleClient()
  const [p1, p2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId]

  let query = supabase
    .from("conversations")
    .select("*")
    .eq("participant1_id", p1)
    .eq("participant2_id", p2)

  if (productId) {
    query = query.eq("product_id", productId)
  } else {
    query = query.is("product_id", null)
  }

  const { data: existing } = await query.maybeSingle()
  if (existing) return existing

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      participant1_id: p1,
      participant2_id: p2,
      product_id: productId ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return created
}

export async function updateUserRating(userId: string) {
  const supabase = createServiceRoleClient()
  const { data: ratings } = await supabase.from("user_ratings").select("stars").eq("to_user_id", userId)

  const count = ratings?.length ?? 0
  const avg = count > 0 ? ratings!.reduce((s, r) => s + r.stars, 0) / count : 0

  await supabase
    .from("profiles")
    .update({ rating_avg: avg, rating_count: count })
    .eq("id", userId)
}

export type AuthUser = AppUser
export type AuthSession = User
