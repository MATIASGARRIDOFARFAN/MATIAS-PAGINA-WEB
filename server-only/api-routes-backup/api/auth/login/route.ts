import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { usmpEmailError } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    const emailError = usmpEmailError(email)
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: "La contraseña es obligatoria" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role, suspended")
      .eq("id", data.user.id)
      .single()

    if (profile?.suspended) {
      await supabase.auth.signOut()
      return NextResponse.json({ error: "Tu cuenta ha sido suspendida." }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        name: profile?.name ?? data.user.email?.split("@")[0],
        email: data.user.email,
        role: profile?.role ?? "user",
      },
    })
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
