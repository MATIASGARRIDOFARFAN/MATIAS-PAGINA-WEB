import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const AUTH_PATHS = ["/publicar", "/perfil", "/mensajes", "/historial", "/favoritos"]
const ADMIN_PATHS = ["/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, user } = await updateSession(request)

  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && !user) {
    const login = new URL("/login", request.url)
    login.searchParams.set("redirect", pathname)
    return NextResponse.redirect(login)
  }

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/publicar", "/perfil", "/mensajes", "/historial", "/favoritos", "/admin"],
}
