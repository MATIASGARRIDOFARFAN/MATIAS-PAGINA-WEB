import type { Product, Seller, TransactionType, Condition, MaterialStatus } from "@/lib/data"
import type { DbProduct, DbProfile } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"

const PRODUCT_SELECT = `
  *,
  seller:profiles!products_seller_id_fkey (
    id, email, first_name, last_name, name, avatar_url, faculty, career,
    role, suspended, rating_avg, rating_count
  )
`

function parseImages(raw: string[] | string): string[] {
  if (Array.isArray(raw)) return raw.length > 0 ? raw : ["/placeholder.svg"]
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : ["/placeholder.svg"]
  } catch {
    return ["/placeholder.svg"]
  }
}

function mapSeller(row: DbProfile, productFaculty: string, productCareer: string): Seller {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar_url || "/placeholder.svg",
    faculty: row.faculty ?? productFaculty,
    career: row.career ?? productCareer,
    verified: true,
    rating: Number(row.rating_avg) || 4.8,
    sales: 0,
    exchanges: 0,
    listings: 0,
    badges: ["Estudiante Verificado"],
  }
}

export function mapDbProduct(row: DbProduct & { seller?: DbProfile }): Product {
  const sellerRow = row.seller
  if (!sellerRow) throw new Error(`Product ${row.id} missing seller`)

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    images: parseImages(row.images),
    category: row.category,
    faculty: row.faculty,
    career: row.career,
    course: row.course,
    condition: row.condition as Condition,
    transaction: row.transaction as TransactionType,
    status: row.status as MaterialStatus,
    stock: row.stock,
    location: row.location,
    views: row.views,
    favorites: row.favorites,
    createdAt: row.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    featured: row.featured,
    seller: mapSeller(sellerRow, row.faculty, row.career),
  }
}

export async function fetchAllProductsClient(): Promise<Product[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
  if (error) {
    console.error(error)
    return []
  }
  return (data ?? []).map((row) => mapDbProduct(row as DbProduct & { seller: DbProfile }))
}

export async function fetchProductByIdClient(id: string): Promise<Product | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle()
  if (error || !data) return null
  return mapDbProduct(data as DbProduct & { seller: DbProfile })
}

export async function fetchRelatedProductsClient(current: Product, limit = 4): Promise<Product[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .neq("id", current.id)
    .or(`career.eq."${current.career}",category.eq.${current.category}`)
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data ?? []).map((row) => mapDbProduct(row as DbProduct & { seller: DbProfile }))
}

export async function fetchFavoriteProductsClient(userId: string): Promise<Product[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("favorites")
    .select(`products (${PRODUCT_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return (data ?? [])
    .map((f) => {
      const p = f.products as unknown as DbProduct & { seller: DbProfile }
      return p ? mapDbProduct(p) : null
    })
    .filter(Boolean) as Product[]
}

export async function fetchProductIdsForStaticBuild(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
  const supabase = createSupabaseClient(url, key)
  const { data } = await supabase.from("products").select("id")
  return (data ?? []).map((p) => p.id)
}
