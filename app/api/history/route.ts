import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { getUserHistory } from "@/lib/history"

export async function GET() {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  const history = await getUserHistory(auth.user!.id)
  return NextResponse.json({ history })
}
