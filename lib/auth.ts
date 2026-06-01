import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { AppUser } from "@/lib/supabase/types"
import { mapProfile } from "@/lib/supabase/types"

export interface SessionUser {
  id: string
  name: string
  email: string
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single()

  return {
    id: user.id,
    name: profile?.name ?? user.user_metadata?.first_name ?? user.email?.split("@")[0] ?? "",
    email: user.email ?? profile?.email ?? "",
  }
}

export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) return null
  return mapProfile(profile)
}

/** @deprecated Usar Supabase Auth directamente */
export async function createSession(_user: SessionUser) {
  /* sesión gestionada por Supabase Auth */
}

/** @deprecated Usar Supabase Auth directamente */
export async function destroySession() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
