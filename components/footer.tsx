import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Image
              src="/usmp-logo.png"
              alt="Universidad de San Martín de Porres"
              width={140}
              height={44}
              className="h-10 w-auto"
            />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Marketplace universitario exclusivo para la comunidad de la USMP.
            </p>
          </div>
          <FooterCol
            title="Marketplace"
            links={[
              ["Explorar", "/"],
              ["Publicar producto", "/publicar"],
              ["Favoritos", "/favoritos"],
              ["Zonas seguras", "/zonas-seguras"],
            ]}
          />
          <FooterCol
            title="Cuenta"
            links={[
              ["Mi perfil", "/perfil"],
              ["Mensajes", "/mensajes"],
              ["Panel de vendedor", "/perfil"],
            ]}
          />
          <FooterCol
            title="Soporte"
            links={[
              ["Cómo funciona", "/"],
              ["Intercambios seguros", "/zonas-seguras"],
              ["Reportar usuario", "/"],
            ]}
          />
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} USMP Market · Solo para estudiantes con correo @usmp.pe
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
