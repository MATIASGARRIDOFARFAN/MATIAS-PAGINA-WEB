import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerifiedAuth, requireAdmin } from "@/lib/api-helpers"
import { sanitizeText } from "@/lib/security"

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const section = searchParams.get("section") ?? "overview"

  if (section === "users") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        emailVerified: true,
        ratingAvg: true,
        createdAt: true,
        _count: { select: { products: true, reportsAgainst: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ users })
  }

  if (section === "products") {
    const products = await prisma.product.findMany({
      include: { seller: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ products })
  }

  if (section === "reports") {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { name: true } },
        targetUser: { select: { name: true, email: true } },
        targetProduct: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ reports })
  }

  const [userCount, productCount, reportCount, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.report.count(),
    prisma.report.count({ where: { status: "pendiente" } }),
  ])

  return NextResponse.json({ stats: { userCount, productCount, reportCount, pendingReports } })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()
  const action = String(body.action ?? "")

  if (action === "suspend_user" && body.userId) {
    await prisma.user.update({
      where: { id: body.userId },
      data: { suspended: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "unsuspend_user" && body.userId) {
    await prisma.user.update({
      where: { id: body.userId },
      data: { suspended: false },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "delete_product" && body.productId) {
    await prisma.product.delete({ where: { id: body.productId } })
    return NextResponse.json({ ok: true })
  }

  if (action === "resolve_report" && body.reportId) {
    await prisma.report.update({
      where: { id: body.reportId },
      data: { status: "resuelto" },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}
