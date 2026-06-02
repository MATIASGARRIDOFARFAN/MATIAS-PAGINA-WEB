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
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, { contentType: file.type })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data } = supabase.storage.from("products").getPublicUrl(fileName)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error("Upload error:", err)
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 })
  }
}