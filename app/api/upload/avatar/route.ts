import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireVerifiedAuth } from "@/lib/api-helpers"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const ext = file.name.split(".").pop()
    const fileName = `${auth.user!.id}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error("Avatar upload error:", err)
    return NextResponse.json({ error: "Error al subir avatar" }, { status: 500 })
  }
}