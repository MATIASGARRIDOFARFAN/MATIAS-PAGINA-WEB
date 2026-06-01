import { MapPin, Clock, ShieldCheck, Library, Coffee, Users, Building2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { campuses } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Zonas seguras · USMP Market",
}

const typeIcon: Record<string, typeof Library> = {
  Biblioteca: Library,
  Cafetería: Coffee,
  Servicios: Users,
  "Área común": MapPin,
}

export default function SafeZonesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold">Zonas seguras de intercambio</h1>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
              Coordina tus compras e intercambios en estos puntos verificados dentro de los campus USMP. Son lugares
              concurridos y monitoreados para que tus transacciones sean seguras.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-10">
            {campuses.map((campus) => (
              <section key={campus.id}>
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Building2 className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold leading-tight">
                      {campus.name} · {campus.city}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {campus.points.length} punto{campus.points.length > 1 ? "s" : ""} verificado
                      {campus.points.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
                  <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                    <iframe
                      title={`Mapa del campus USMP ${campus.city}`}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${campus.bbox}&layer=mapnik`}
                      className="h-[360px] w-full"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {campus.points.map((p) => {
                      const Icon = typeIcon[p.type] ?? MapPin
                      return (
                        <div key={p.id} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="grid size-9 place-items-center rounded-full bg-accent text-primary">
                                <Icon className="size-4" />
                              </span>
                              <div>
                                <h3 className="font-semibold leading-tight">{p.name}</h3>
                                <p className="text-xs text-muted-foreground">{p.type}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="gap-1 rounded-full text-xs font-normal">
                              <ShieldCheck className="size-3 text-primary" />
                              Seguridad {p.level}
                            </Badge>
                          </div>
                          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="size-3.5" />
                            {p.schedule}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
