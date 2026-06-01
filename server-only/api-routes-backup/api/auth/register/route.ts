import { NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server"
import { usmpEmailError } from "@/lib/validations"
import { sanitizeText } from "@/lib/security"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const firstName = sanitizeText(String(body.firstName ?? ""), 100)
    const lastName = sanitizeText(String(body.lastName ?? ""), 100)
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!firstName) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
    }

    const emailError = usmpEmailError(email)
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    const admin = createServiceRoleClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    })

    if (error) {
      if (error.message.includes("already") || error.message.includes("registered")) {
        return NextResponse.json({ error: "Este correo ya está registrado. Inicia sesión." }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await admin.from("profiles").upsert({
      id: data.user!.id,
      email,
      first_name: firstName,
      last_name: lastName,
    })

    const supabase = await createServerSupabaseClient()
    await supabase.auth.signInWithPassword({ email, password })

    return NextResponse.json({
      message: "Cuenta creada correctamente.",
      user: {
        id: data.user!.id,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: "user",
      },
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Error al registrar la cuenta" }, { status: 500 })
  }
}
