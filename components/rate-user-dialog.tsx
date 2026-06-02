"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RatingStars } from "@/components/rating-stars"
import { Star } from "lucide-react"

export function RateUserDialog({
  toUserId,
  toUserName,
  requestId,
}: {
  toUserId: string
  toUserName: string
  requestId: string
}) {
  const [open, setOpen] = useState(false)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    setSaving(true)
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, requestId, stars, comment }),
      })
      if (res.ok) {
        setDone(true)
        setOpen(false)
      } else {
        const data = await res.json()
        alert(data.error ?? "No se pudo guardar la calificación")
      }
    } finally {
      setSaving(false)
    }
  }

  if (done) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5">
          <Star className="size-4" />
          Calificar a {toUserName.split(" ")[0]}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calificar vendedor</DialogTitle>
          <DialogDescription>
            Califica a {toUserName} según tu experiencia tras completar la transacción.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <RatingStars value={stars} onChange={setStars} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario opcional..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            Enviar calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
