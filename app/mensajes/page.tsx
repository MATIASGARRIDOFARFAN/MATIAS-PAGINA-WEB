import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ChatWrapper } from "@/components/chat-wrapper"
import { AuthGuard } from "@/components/auth-guard"

export const metadata = {
  title: "Mensajes · USMP Market",
}

export default function MessagesPage() {
  return (
    <AuthGuard>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h1 className="mb-4 text-2xl font-bold">Mensajes internos</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Comunicación segura dentro de la plataforma. Teléfonos y correos personales están bloqueados.
          </p>
          <Suspense fallback={<div className="h-[560px] animate-pulse rounded-2xl bg-muted" />}>
            <ChatWrapper />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
    </AuthGuard>
  )
}
