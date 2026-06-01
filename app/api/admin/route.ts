import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api-helpers"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const { searchParams } = new URL(request.url)
  const section = searchParams.get("section") ?? "overview"
  const supabase = createServiceRoleClient()

  if (section === "users") {
    const { data: users } = await supabase
      .from("profiles")
      .select("id, name, email, role, suspended, rating_avg, created_at")
      .order("created_at", { ascending: false })

    const enriched = await Promise.all(
      (users ?? []).map(async (u) => {
        const [{ count: products }, { count: reports }] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", u.id),
          supabase.from("reports").select("*", { count: "exact", head: true }).eq("target_user_id", u.id),
        ])
        return { ...u, _count: { products: products ?? 0, reportsAgainst: reports ?? 0 } }
      }),
    )

    return NextResponse.json({ users: enriched })
  }

  if (section === "products") {
    const { data: products } = await supabase
      .from("products")
      .select("*, seller:profiles!products_seller_id_fkey(name, email)")
      .order("created_at", { ascending: false })
      .limit(50)
    return NextResponse.json({ products })
  }

  if (section === "reports") {
    const { data: reports } = await supabase
      .from("reports")
      .select(
        `*,
        reporter:profiles!reports_reporter_id_fkey(name),
        target_user:profiles!reports_target_user_id_fkey(name, email),
        target_product:products(title)`,
      )
      .order("created_at", { ascending: false })
    return NextResponse.json({ reports })
  }

  const [{ count: userCount }, { count: productCount }, { count: reportCount }, { count: pendingReports }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pendiente"),
    ])

  return NextResponse.json({
    stats: {
      userCount: userCount ?? 0,
      productCount: productCount ?? 0,
      reportCount: reportCount ?? 0,
      pendingReports: pendingReports ?? 0,
    },
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const body = await request.json()
  const action = String(body.action ?? "")
  const supabase = createServiceRoleClient()

  if (action === "suspend_user" && body.userId) {
    await supabase.from("profiles").update({ suspended: true }).eq("id", body.userId)
    return NextResponse.json({ ok: true })
  }

  if (action === "unsuspend_user" && body.userId) {
    await supabase.from("profiles").update({ suspended: false }).eq("id", body.userId)
    return NextResponse.json({ ok: true })
  }

  if (action === "delete_product" && body.productId) {
    await supabase.from("products").delete().eq("id", body.productId)
    return NextResponse.json({ ok: true })
  }

  if (action === "resolve_report" && body.reportId) {
    await supabase.from("reports").update({ status: "resuelto" }).eq("id", body.reportId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}
