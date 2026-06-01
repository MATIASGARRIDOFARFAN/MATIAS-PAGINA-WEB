import { NextResponse } from "next/server"
import { requireVerifiedAuth } from "@/lib/api-helpers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const auth = await requireVerifiedAuth()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status! })

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const bucket = String(formData.get("bucket") ?? "product-images")
    const path = String(formData.get("path") ?? "")

    if (!file || !path) {
      return NextResponse.json({ error: "Archivo y path requeridos" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      console.error("upload error:", error)
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch {
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
