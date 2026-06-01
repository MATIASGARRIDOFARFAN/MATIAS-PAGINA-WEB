"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { type Product, categories, faculties } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const locations = [
  "Biblioteca Central",
  "Cafetería Central",
  "Patio Principal",
  "Centro de Estudiantes",
]

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (product: Product) => void
}

export function EditProductDialog({ product, open, onOpenChange, onSaved }: EditProductDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [facultyId, setFacultyId] = useState("")
  const [career, setCareer] = useState("")
  const [course, setCourse] = useState("")
  const [condition, setCondition] = useState("")
  const [transaction, setTransaction] = useState("")
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("1")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const facultyName = faculties.find((f) => f.id === facultyId)?.name ?? ""
  const careers = faculties.find((f) => f.id === facultyId)?.careers ?? []
  const courses = careers.find((c) => c.name === career)?.courses ?? []

  function resetFromProduct(p: Product) {
    setTitle(p.title)
    setDescription(p.description)
    setCategory(p.category)
    const faculty = faculties.find((f) => f.name === p.faculty)
    setFacultyId(faculty?.id ?? "")
    setCareer(p.career)
    setCourse(p.course)
    setCondition(p.condition)
    setTransaction(p.transaction)
    setLocation(p.location)
    setPrice(String(p.price))
    setStock(String(p.stock))
    setError("")
  }

  function handleOpenChange(next: boolean) {
    if (next && product) resetFromProduct(product)
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          faculty: facultyName || product.faculty,
          career,
          course,
          condition,
          transaction,
          location,
          price: transaction === "intercambio" ? 0 : Number(price),
          stock: Number(stock),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar")
        return
      }

      onSaved(data.product)
      onOpenChange(false)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar publicación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Descripción</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
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
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="seminuevo">Seminuevo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <Select
                value={career}
                onValueChange={(v) => {
                  setCareer(v)
                  setCourse("")
                }}
                disabled={!facultyId}
              >
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
              <Select value={course} onValueChange={setCourse} disabled={!career}>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de transacción</Label>
              <Select value={transaction} onValueChange={setTransaction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venta">Venta</SelectItem>
                  <SelectItem value="intercambio">Intercambio</SelectItem>
                  <SelectItem value="ambos">Venta o intercambio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Precio (S/)</Label>
              <Input
                id="edit-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={transaction === "intercambio"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Punto de entrega</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
