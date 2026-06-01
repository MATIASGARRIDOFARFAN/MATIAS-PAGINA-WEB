import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, first_name, last_name, email, faculty, career, role, rating_avg, rating_count, suspended")
    .eq("id", user.id)
    .single()

  if (!profile || profile.suspended) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.name,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      faculty: profile.faculty,
      career: profile.career,
      role: profile.role,
      ratingAvg: profile.rating_avg,
      ratingCount: profile.rating_count,
      verified: true,
    },
  })
}
