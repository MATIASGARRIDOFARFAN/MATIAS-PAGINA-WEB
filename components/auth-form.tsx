"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usmpEmailError } from "@/lib/validations"
import { clientApi } from "@/lib/client-api"

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerFirstName, setRegisterFirstName] = useState("")
  const [registerLastName, setRegisterLastName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const emailError = usmpEmailError(loginEmail)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    try {
      const data = await clientApi.auth.login(loginEmail, loginPassword)
      if ("error" in data && data.error) {
        setError(data.error)
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const emailError = usmpEmailError(registerEmail)
    if (emailError) {
      setError(emailError)
      return
    }

    if (registerPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)
    try {
      const data = await clientApi.auth.register(
        registerFirstName,
        registerLastName,
        registerEmail,
        registerPassword,
      )
      if ("error" in data && data.error) {
        setError(data.error)
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
        <TabsTrigger value="register">Registrarse</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-6">
        <h2 className="text-xl font-semibold">Bienvenido de vuelta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu correo institucional.</p>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <EmailField
            id="login-email"
            email={loginEmail}
            setEmail={setLoginEmail}
            error={error}
            placeholder="juan.perez@usmp.pe"
          />
          <div className="space-y-2">
            <Label htmlFor="pwd">Contraseña</Label>
            <Input
              id="pwd"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Iniciar sesión"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="register" className="mt-6">
        <h2 className="text-xl font-semibold">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usa tu correo en formato <strong>nombre.apellido@usmp.pe</strong>
        </p>
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fname">Nombre</Label>
              <Input
                id="fname"
                value={registerFirstName}
                onChange={(e) => setRegisterFirstName(e.target.value)}
                placeholder="Juan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lname">Apellidos</Label>
              <Input
                id="lname"
                value={registerLastName}
                onChange={(e) => setRegisterLastName(e.target.value)}
                placeholder="Pérez"
                required
              />
            </div>
          </div>
          <EmailField
            id="register-email"
            email={registerEmail}
            setEmail={setRegisterEmail}
            error={error}
            placeholder="juan.perez@usmp.pe"
          />
          <div className="space-y-2">
            <Label htmlFor="rpwd">Contraseña</Label>
            <Input
              id="rpwd"
              type="password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Crear cuenta"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Tu perfil mostrará el badge de Estudiante Verificado
          </p>
        </form>
      </TabsContent>
    </Tabs>
  )
}

function EmailField({
  id,
  email,
  setEmail,
  error,
  placeholder,
}: {
  id: string
  email: string
  setEmail: (v: string) => void
  error: string
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Correo institucional</Label>
      <Input
        id={id}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        aria-invalid={!!error}
      />
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
