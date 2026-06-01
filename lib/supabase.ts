export { createClient } from "./client"
export { createServerSupabaseClient, createServiceRoleClient } from "./server"
export { mapProfile, isUsmpEmail, type AppUser, type DbProfile, type DbProduct } from "./types"

export const TABLES = {
  profiles: "profiles",
  products: "products",
  favorites: "favorites",
  materialRequests: "material_requests",
  conversations: "conversations",
  messages: "messages",
  notifications: "notifications",
  historyEntries: "history_entries",
  userRatings: "user_ratings",
  productRatings: "product_ratings",
  reports: "reports",
} as const

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  productImages: "product-images",
} as const
