import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "usmp_session"

const AUTH_PATHS = ["/publicar", "/perfil", "/mensajes", "/historial"]
const ADMIN_PATHS = ["/admin"]

async function getSessionPayload(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const payload = await getSessionPayload(request)
    if (!payload) {
      const login = new URL("/login", request.url)
      login.searchParams.set("redirect", pathname)
      return NextResponse.redirect(login)
    }
  }

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const payload = await getSessionPayload(request)
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    // Role check happens server-side in admin page/API
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/publicar", "/perfil", "/mensajes", "/historial", "/admin"],
}
