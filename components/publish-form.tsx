"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImagePlus, X, Star, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { faculties, categories } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const locationLabels: Record<string, string> = {
  biblioteca: "Biblioteca Central",
  cafeteria: "Cafetería Central",
  patio: "Patio Principal",
  centro: "Centro de Estudiantes",
}

export function PublishForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [facultyId, setFacultyId] = useState("")
  const [career, setCareer] = useState("")
  const [course, setCourse] = useState("")
  const [category, setCategory] = useState("")
  const [condition, setCondition] = useState("")
  const [transaction, setTransaction] = useState("")
  const [location, setLocation] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("1")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const facultyName = faculties.find((f) => f.id === facultyId)?.name ?? ""
  const careers = faculties.find((f) => f.id === facultyId)?.careers ?? []
  const courses = careers.find((c) => c.name === career)?.courses ?? []

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const urls = files.map((f) => URL.createObjectURL(f))
    setImages((prev) => [...prev, ...urls])
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  function makePrimary(i: number) {
    setImages((prev) => {
      const next = [...prev]
      const [img] = next.splice(i, 1)
      next.unshift(img)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          faculty: facultyName,
          career,
          course,
          condition,
          transaction,
          location: locationLabels[location] ?? location,
          price: transaction === "intercambio" ? 0 : Number(price),
          stock: Number(stock),
          images: images.length > 0 ? images : ["/placeholder.svg"],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar el producto")
        return
      }

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-border bg-card py-12 text-center">
        <CheckCircle2 className="size-14 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">¡Publicación creada!</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Tu producto ya está visible en el marketplace para la comunidad USMP.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => router.push("/")}>Ir al marketplace</Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false)
              setTitle("")
              setDescription("")
              setImages([])
              setCategory("")
              setCondition("")
              setTransaction("")
              setLocation("")
              setPrice("")
              setStock("1")
              setFacultyId("")
              setCareer("")
              setCourse("")
            }}
          >
            Publicar otro
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Imágenes</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sube varias fotos. La primera será la imagen principal.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={img || "/placeholder.svg"} alt="" fill className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principal
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    aria-label="Marcar como principal"
                    className="grid size-7 place-items-center rounded-full bg-background text-foreground"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Eliminar imagen"
                  className="grid size-7 place-items-center rounded-full bg-background text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="size-6" />
            <span className="text-xs">Agregar</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Detalles del producto</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Apuntes completos de Base de Datos"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Descripción</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el estado, características y detalles..."
            rows={4}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={condition} onValueChange={setCondition} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="seminuevo">Seminuevo</SelectItem>
                <SelectItem value="usado">Usado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Estructura académica</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Facultad</Label>
            <Select
              value={facultyId}
              onValueChange={(v) => {
                setFacultyId(v)
                setCareer("")
                setCourse("")
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Facultad" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Carrera</Label>
            <Select value={career} onValueChange={(v) => { setCareer(v); setCourse("") }} disabled={!facultyId} required>
              <SelectTrigger>
                <SelectValue placeholder="Carrera" />
              </SelectTrigger>
              <SelectContent>
                {careers.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={course} onValueChange={setCourse} disabled={!career} required>
              <SelectTrigger>
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Transacción y contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">Precio (S/)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              disabled={transaction === "intercambio"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock disponible</Label>
            <Input
              id="stock"
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de transacción</Label>
            <Select value={transaction} onValueChange={setTransaction} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venta">Venta</SelectItem>
                <SelectItem value="intercambio">Intercambio</SelectItem>
                <SelectItem value="ambos">Venta o intercambio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Punto de entrega</Label>
            <Select value={location} onValueChange={setLocation} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una zona segura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="biblioteca">Biblioteca Central</SelectItem>
                <SelectItem value="cafeteria">Cafetería Central</SelectItem>
                <SelectItem value="patio">Patio Principal</SelectItem>
                <SelectItem value="centro">Centro de Estudiantes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className={cn("flex justify-end gap-3")}>
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Publicar producto"}
        </Button>
      </div>
    </form>
  )
}
