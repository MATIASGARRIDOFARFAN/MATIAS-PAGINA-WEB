import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession } from "@/lib/auth"
import { usmpEmailError } from "@/lib/validations"
import { notifyLoginAlert } from "@/lib/notifications"

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

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: "No existe una cuenta con ese correo. Regístrate primero." },
        { status: 401 },
      )
    }

    if (user.suspended) {
      return NextResponse.json({ error: "Tu cuenta ha sido suspendida." }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verifyCode: null, verifyCodeExpiry: null },
      })
    }

    await createSession({ id: user.id, name: user.name, email: user.email })
    await notifyLoginAlert(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
