import { ShieldCheck, Recycle, GraduationCap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
            <GraduationCap className="size-3.5" />
            Exclusivo para estudiantes USMP
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Compra, vende e intercambia recursos universitarios
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
            El marketplace de la comunidad sanmartiniana. Encuentra libros, tecnología, materiales y todo lo que
            necesitas para tus cursos, directamente con otros estudiantes verificados.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Estudiantes verificados
            </span>
            <span className="flex items-center gap-2">
              <Recycle className="size-4" />
              Reutiliza materiales
            </span>
            <span className="flex items-center gap-2">
              <GraduationCap className="size-4" />
              Por facultad y curso
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
