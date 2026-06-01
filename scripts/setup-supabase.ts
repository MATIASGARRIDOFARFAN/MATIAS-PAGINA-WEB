/**
 * Ejecutar una vez después de aplicar supabase/schema.sql:
 *   npx tsx scripts/setup-supabase.ts
 */
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch {
    /* .env.local optional if vars already set */
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

async function ensureBucket(id: string, publicBucket = true) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.id === id)) {
    console.log(`✓ Bucket "${id}" ya existe`)
    return
  }
  const { error } = await supabase.storage.createBucket(id, { public: publicBucket })
  if (error) console.error(`✗ Bucket "${id}":`, error.message)
  else console.log(`✓ Bucket "${id}" creado`)
}

async function seedAdmin() {
  const email = "admin@usmp.pe"
  const password = "admin12345"

  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle()
  if (existing) {
    await supabase.from("profiles").update({ role: "admin" }).eq("id", existing.id)
    console.log("✓ Admin ya existe, rol actualizado")
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Admin", last_name: "USMP" },
  })

  if (error) {
    console.error("✗ Admin seed:", error.message)
    return
  }

  await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user!.id)
  console.log("✓ Admin creado: admin@usmp.pe / admin12345")
}

async function testConnection() {
  const { error } = await supabase.from("profiles").select("id").limit(1)
  if (error?.code === "42P01" || error?.message.includes("does not exist")) {
    console.error("\n⚠ Las tablas no existen. Ejecuta supabase/schema.sql en el SQL Editor de Supabase primero.\n")
    process.exit(1)
  }
  if (error) {
    console.error("✗ Conexión:", error.message)
    process.exit(1)
  }
  console.log("✓ Conexión a Supabase OK")
}

async function main() {
  console.log("Configurando Supabase...\n")
  await testConnection()
  await ensureBucket("avatars", true)
  await ensureBucket("product-images", true)
  await seedAdmin()
  console.log("\nListo.")
}

main()
