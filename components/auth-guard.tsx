"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clientApi } from "@/lib/client-api"

export function AuthGuard({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    clientApi.auth.me().then(({ user }) => {
      if (!user) {
        const path = typeof window !== "undefined" ? window.location.pathname : ""
        router.replace(`${redirectTo}?redirect=${encodeURIComponent(path)}`)
        return
      }
      setReady(true)
    })
  }, [router, redirectTo])

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Verificando sesión…</div>
    )
  }

  return <>{children}</>
}
