/**
 * Capa de datos para exportación estática (GitHub Pages).
 * Reemplaza fetch('/api/...') cuando no hay servidor Node.
 */
import { createClient } from "@/lib/supabase/client"
import { usmpEmailError } from "@/lib/validations"
import {
  fetchAllProductsClient,
  fetchFavoriteProductsClient,
  fetchProductByIdClient,
  mapDbProduct,
} from "@/lib/products-client"
import type { Product } from "@/lib/data"
import type { DbProduct, DbProfile } from "@/lib/supabase/types"

const PRODUCT_SELECT = `
  *,
  seller:profiles!products_seller_id_fkey (
    id, email, first_name, last_name, name, avatar_url, faculty, career,
    role, suspended, rating_avg, rating_count
  )
`

export const clientApi = {
  auth: {
    async me() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { user: null }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email, role, suspended")
        .eq("id", user.id)
        .single()
      if (!profile || profile.suspended) return { user: null }
      return {
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        },
      }
    },

    async login(email: string, password: string) {
      const emailError = usmpEmailError(email)
      if (emailError) return { error: emailError, status: 400 }
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) return { error: "Correo o contraseña incorrectos", status: 401 }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role, suspended")
        .eq("id", data.user.id)
        .single()
      if (profile?.suspended) {
        await supabase.auth.signOut()
        return { error: "Tu cuenta ha sido suspendida.", status: 403 }
      }
      return {
        user: {
          id: data.user.id,
          name: profile?.name ?? data.user.email?.split("@")[0],
          email: data.user.email,
          role: profile?.role ?? "user",
        },
      }
    },

    async register(firstName: string, lastName: string, email: string, password: string) {
      if (!firstName.trim()) return { error: "El nombre es obligatorio", status: 400 }
      const emailError = usmpEmailError(email)
      if (emailError) return { error: emailError, status: 400 }
      if (password.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres", status: 400 }
      }
      const supabase = createClient()
      const normalized = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: { data: { first_name: firstName, last_name: lastName } },
      })
      if (error) {
        if (error.message.includes("already") || error.message.includes("registered")) {
          return { error: "Este correo ya está registrado. Inicia sesión.", status: 409 }
        }
        return { error: error.message, status: 400 }
      }
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: normalized,
          first_name: firstName,
          last_name: lastName,
        })
      }
      const login = await supabase.auth.signInWithPassword({ email: normalized, password })
      if (login.error) return { error: login.error.message, status: 400 }
      return {
        user: {
          id: data.user!.id,
          name: `${firstName} ${lastName}`.trim(),
          email: normalized,
          role: "user",
        },
      }
    },

    async logout() {
      const supabase = createClient()
      await supabase.auth.signOut()
      return { ok: true }
    },
  },

  products: {
    list: fetchAllProductsClient,
    get: fetchProductByIdClient,
    async create(body: Record<string, unknown>) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { data, error } = await supabase
        .from("products")
        .insert({
          title: body.title,
          description: body.description,
          price: body.price,
          images: body.images,
          category: body.category,
          faculty: body.faculty,
          career: body.career,
          course: body.course,
          condition: body.condition,
          transaction: body.transaction,
          location: body.location,
          stock: body.stock,
          seller_id: user.id,
          status: "disponible",
        })
        .select(PRODUCT_SELECT)
        .single()
      if (error) return { error: "Error al publicar", status: 500 }
      await supabase
        .from("profiles")
        .update({ faculty: body.faculty, career: body.career })
        .eq("id", user.id)
      return { product: mapDbProduct(data as DbProduct & { seller: DbProfile }) }
    },
    async update(id: string, body: Record<string, unknown>) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .update(body)
        .eq("id", id)
        .select(PRODUCT_SELECT)
        .single()
      if (error) return { error: "Error al actualizar", status: 500 }
      return { product: mapDbProduct(data as DbProduct & { seller: DbProfile }) }
    },
    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) return { error: "Error al eliminar", status: 500 }
      return { ok: true }
    },
  },

  favorites: {
    async check(productId: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { favorited: false }
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle()
      return { favorited: !!data }
    },
    async add(productId: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { error } = await supabase.from("favorites").insert({ user_id: user.id, product_id: productId })
      if (error && error.code !== "23505") return { error: error.message, status: 500 }
      return { ok: true }
    },
    async remove(productId: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId)
      return { ok: true }
    },
    list: fetchFavoriteProductsClient,
  },

  profile: {
    async get() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      const { data: myProducts } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("seller_id", user.id)
      const mapped = (myProducts ?? []).map((p) => mapDbProduct(p as DbProduct & { seller: DbProfile }))
      return {
        user: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          avatar: profile.avatar_url,
          phone: profile.phone,
          faculty: profile.faculty,
          career: profile.career,
          verified: true,
          ratingAvg: profile.rating_avg,
          ratingCount: profile.rating_count,
          role: profile.role,
          badges: ["Estudiante Verificado"],
        },
        products: mapped,
        stats: {
          views: mapped.reduce((s, p) => s + p.views, 0),
          listings: mapped.length,
          favorites: mapped.reduce((s, p) => s + p.favorites, 0),
        },
      }
    },
    async patch(body: Record<string, unknown>) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const updates: Record<string, unknown> = {}
      if (body.firstName != null) updates.first_name = body.firstName
      if (body.lastName != null) updates.last_name = body.lastName
      if (body.bio !== undefined) updates.bio = body.bio
      if (body.avatar != null) updates.avatar_url = body.avatar
      if (body.phone !== undefined) updates.phone = body.phone
      if (updates.first_name || updates.last_name) {
        const { data: cur } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single()
        updates.name = `${updates.first_name ?? cur?.first_name} ${updates.last_name ?? cur?.last_name}`.trim()
      }
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id).select().single()
      if (error) return { error: "Error al actualizar", status: 500 }
      return { user: data }
    },
  },

  requests: {
    async create(body: { productId: string; type: string; message: string }) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { data: product } = await supabase.from("products").select("*").eq("id", body.productId).single()
      if (!product) return { error: "Producto no encontrado", status: 404 }
      if (product.seller_id === user.id) return { error: "No puedes solicitar tu propio material", status: 400 }
      const { data, error } = await supabase
        .from("material_requests")
        .insert({
          product_id: body.productId,
          requester_id: user.id,
          owner_id: product.seller_id,
          type: body.type,
          message: body.message,
          status: "pendiente",
        })
        .select()
        .single()
      if (error) return { error: "Error al enviar solicitud", status: 500 }
      await supabase.from("products").update({ status: "reservado" }).eq("id", body.productId)
      return { request: data }
    },
  },

  conversations: {
    async list() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { conversations: [] }
      const { data } = await supabase
        .from("conversations")
        .select(`id, product_id, participant1_id, participant2_id, product:products(id, title), messages(content, created_at, sender_id)`)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })
      const result = (data ?? []).map((c) => {
        const otherId = c.participant1_id === user.id ? c.participant2_id : c.participant1_id
        const msgs = (c.messages as { content: string; created_at: string; sender_id: string }[]) ?? []
        const last = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        return {
          id: c.id,
          product: c.product,
          otherUser: { id: otherId },
          lastMessage: last
            ? { content: last.content, createdAt: last.created_at, senderId: last.sender_id }
            : null,
        }
      })
      return { conversations: result }
    },
    async create(otherUserId: string, productId?: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const [p1, p2] = user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id]
      let q = supabase.from("conversations").select("id").eq("participant1_id", p1).eq("participant2_id", p2)
      q = productId ? q.eq("product_id", productId) : q.is("product_id", null)
      const { data: existing } = await q.maybeSingle()
      if (existing) return { conversationId: existing.id }
      const { data, error } = await supabase
        .from("conversations")
        .insert({ participant1_id: p1, participant2_id: p2, product_id: productId ?? null })
        .select("id")
        .single()
      if (error) return { error: error.message, status: 500 }
      return { conversationId: data.id }
    },
    async messages(conversationId: string) {
      const supabase = createClient()
      const { data } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
      const mapped = (data ?? []).map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        senderId: m.sender_id,
        filtered: m.filtered,
        filterReason: m.filter_reason,
        sender: m.sender ? { id: m.sender.id, name: m.sender.name, avatar: m.sender.avatar_url } : null,
      }))
      return { messages: mapped }
    },
    async sendMessage(conversationId: string, content: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: user.id, content })
        .select("*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url)")
        .single()
      if (error) return { error: error.message, status: 500 }
      return {
        message: {
          id: data.id,
          content: data.content,
          createdAt: data.created_at,
          senderId: data.sender_id,
          sender: data.sender ? { id: data.sender.id, name: data.sender.name, avatar: data.sender.avatar_url } : null,
        },
      }
    },
  },

  notifications: {
    async list() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { notifications: [], unreadCount: 0 }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
      const unreadCount = (data ?? []).filter((n) => !n.read).length
      return {
        notifications: (data ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          createdAt: n.created_at,
        })),
        unreadCount,
      }
    },
    async markAllRead() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { ok: true }
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
      return { ok: true }
    },
  },

  history: {
    async list() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { history: [] }
      const { data } = await supabase
        .from("history_entries")
        .select("id, type, status, created_at, related_user_id, product_id, products(id, title, images)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)
      return {
        history: (data ?? []).map((e) => ({
          id: e.id,
          type: e.type,
          status: e.status,
          createdAt: e.created_at,
          product: e.products
            ? {
                id: (e.products as { id: string }).id,
                title: (e.products as { title: string }).title,
              }
            : null,
          relatedUser: e.related_user_id ? { id: e.related_user_id } : null,
        })),
      }
    },
  },

  admin: {
    async get(section: string) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado", status: 401 }
      const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (me?.role !== "admin") return { error: "Acceso denegado", status: 403 }
      if (section === "users") {
        const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        return { users: users ?? [] }
      }
      if (section === "reports") {
        const { data: reports } = await supabase.from("reports").select("*").order("created_at", { ascending: false })
        return { reports: reports ?? [] }
      }
      const [{ count: userCount }, { count: productCount }, { count: reportCount }, { count: pendingReports }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("reports").select("*", { count: "exact", head: true }),
          supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pendiente"),
        ])
      return {
        stats: {
          userCount: userCount ?? 0,
          productCount: productCount ?? 0,
          reportCount: reportCount ?? 0,
          pendingReports: pendingReports ?? 0,
        },
      }
    },
    async patch(body: Record<string, string>) {
      const supabase = createClient()
      const action = body.action
      if (action === "suspend_user" && body.userId) {
        await supabase.from("profiles").update({ suspended: true }).eq("id", body.userId)
      }
      if (action === "unsuspend_user" && body.userId) {
        await supabase.from("profiles").update({ suspended: false }).eq("id", body.userId)
      }
      if (action === "delete_product" && body.productId) {
        await supabase.from("products").delete().eq("id", body.productId)
      }
      if (action === "resolve_report" && body.reportId) {
        await supabase.from("reports").update({ status: "resuelto" }).eq("id", body.reportId)
      }
      return { ok: true }
    },
  },

  upload: {
    async file(file: File, path: string, bucket = "product-images") {
      const supabase = createClient()
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) return { error: error.message, status: 500 }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return { url: data.publicUrl }
    },
  },
}

/** Usar clientApi en lugar de fetch('/api/...') */
export function useStaticApi() {
  return typeof window !== "undefined"
}
