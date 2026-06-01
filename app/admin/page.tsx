"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AdminPage() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([])
  const [tab, setTab] = useState("overview")
  const [error, setError] = useState("")

  async function load(section: string) {
    const res = await fetch(`/api/admin?section=${section}`)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Acceso denegado")
      return
    }
    if (section === "overview") setStats(data.stats)
    if (section === "users") setUsers(data.users)
    if (section === "reports") setReports(data.reports)
  }

  useEffect(() => {
    load(tab)
  }, [tab])

  async function action(body: Record<string, string>) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    load(tab)
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-destructive">{error}</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold">Panel de administración</h1>
          <div className="mt-4 flex gap-2">
            {["overview", "users", "reports"].map((t) => (
              <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
                {t === "overview" ? "Resumen" : t === "users" ? "Usuarios" : "Reportes"}
              </Button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-2xl font-bold">{v}</p>
                  <p className="text-xs text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="mt-6 space-y-2">
              {users.map((u) => (
                <div key={String(u.id)} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{String(u.name)}</p>
                    <p className="text-sm text-muted-foreground">{String(u.email)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Boolean(u.suspended) && <Badge variant="destructive">Suspendido</Badge>}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        action({
                          action: u.suspended ? "unsuspend_user" : "suspend_user",
                          userId: String(u.id),
                        })
                      }
                    >
                      {u.suspended ? "Reactivar" : "Suspender"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "reports" && (
            <div className="mt-6 space-y-2">
              {reports.map((r) => (
                <div key={String(r.id)} className="rounded-lg border border-border p-3">
                  <p className="text-sm">{String(r.reason)}</p>
                  <p className="text-xs text-muted-foreground">Estado: {String(r.status)}</p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => action({ action: "resolve_report", reportId: String(r.id) })}
                  >
                    Marcar resuelto
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
