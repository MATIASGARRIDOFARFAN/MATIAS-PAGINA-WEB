import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createSession } from "@/lib/auth"
import { usmpEmailError } from "@/lib/validations"
import { sanitizeText } from "@/lib/security"
import { fullName } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const firstName = sanitizeText(String(body.firstName ?? body.name?.split(" ")[0] ?? ""), 100)
    const lastName = sanitizeText(String(body.lastName ?? body.name?.split(" ").slice(1).join(" ") ?? ""), 100)
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const phone = body.phone ? sanitizeText(String(body.phone), 20) : null

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

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado. Inicia sesión." }, { status: 409 })
    }

    const name = fullName(firstName, lastName)

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name,
        email,
        phone,
        passwordHash: await hashPassword(password),
        emailVerified: true,
      },
    })

    await createSession({ id: user.id, name: user.name, email: user.email })

    return NextResponse.json({
      message: "Cuenta creada",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json({ error: "Error al registrar la cuenta" }, { status: 500 })
  }
}
