import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PublishForm } from "@/components/publish-form"
import { AuthGuard } from "@/components/auth-guard"

export const metadata = {
  title: "Publicar producto · USMP Market",
}

export default function PublishPage() {
  return (
    <AuthGuard>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold">Publicar un producto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte tus recursos con otros estudiantes de la USMP. Tu publicación será visible para tu comunidad
            universitaria.
          </p>
          <div className="mt-6">
            <PublishForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </AuthGuard>
  )
}
