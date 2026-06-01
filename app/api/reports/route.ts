import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { sanitizeText } from "@/lib/security"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const body = await request.json()
    const reason = sanitizeText(String(body.reason ?? ""), 1000)
    const targetUserId = body.targetUserId ? String(body.targetUserId) : null
    const targetProductId = body.targetProductId ? String(body.targetProductId) : null

    if (!reason) {
      return NextResponse.json({ error: "Describe el motivo del reporte" }, { status: 400 })
    }

    if (!targetUserId && !targetProductId) {
      return NextResponse.json({ error: "Indica qué deseas reportar" }, { status: 400 })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: auth.user!.id,
        targetUserId,
        targetProductId,
        reason,
      },
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al enviar reporte" }, { status: 500 })
  }
}
