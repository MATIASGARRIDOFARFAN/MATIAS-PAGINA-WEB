import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { ShieldCheck } from "lucide-react"
import { AuthForm } from "@/components/auth-form"

export const metadata = {
  title: "Acceso · USMP Market",
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="inline-flex">
          <Image
            src="/usmp-logo.png"
            alt="USMP"
            width={150}
            height={48}
            className="h-11 w-auto rounded bg-background p-1.5"
          />
        </Link>
        <div className="max-w-md">
          <h1 className="text-balance text-3xl font-bold leading-tight">
            El marketplace exclusivo de la comunidad sanmartiniana
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-primary-foreground/85">
            Compra, vende e intercambia recursos universitarios de forma segura con estudiantes verificados de la USMP.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <ShieldCheck className="size-5" />
            Solo correos institucionales @usmp.pe
          </div>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Universidad de San Martín de Porres
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image src="/usmp-logo.png" alt="USMP" width={140} height={44} className="h-10 w-auto" />
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
