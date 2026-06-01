export interface DbProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  name: string
  bio: string | null
  avatar_url: string
  phone: string | null
  faculty: string | null
  career: string | null
  role: "user" | "admin"
  suspended: boolean
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  images: string[] | string
  category: string
  faculty: string
  career: string
  course: string
  condition: string
  transaction: string
  status: string
  stock: number
  location: string
  views: number
  favorites: number
  featured: boolean
  created_at: string
  updated_at: string
  seller?: DbProfile
  profiles?: DbProfile
}

export interface AppUser {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  bio: string | null
  avatar: string
  phone: string | null
  faculty: string | null
  career: string | null
  role: string
  suspended: boolean
  ratingAvg: number
  ratingCount: number
}

export function mapProfile(row: DbProfile): AppUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.name,
    bio: row.bio,
    avatar: row.avatar_url,
    phone: row.phone,
    faculty: row.faculty,
    career: row.career,
    role: row.role,
    suspended: row.suspended,
    ratingAvg: Number(row.rating_avg) || 0,
    ratingCount: row.rating_count || 0,
  }
}

export function isUsmpEmail(email: string) {
  return /^[a-z0-9]+(\.[a-z0-9]+)*@usmp\.pe$/i.test(email.trim())
}
