"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
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

export function ReportDialog({
  targetUserId,
  targetProductId,
  label = "Reportar",
}: {
  targetUserId?: string
  targetProductId?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!reason.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, targetUserId, targetProductId }),
      })
      if (res.ok) {
        setDone(true)
        setOpen(false)
      } else {
        const data = await res.json()
        alert(data.error ?? "No se pudo enviar el reporte")
      }
    } finally {
      setSaving(false)
    }
  }

  if (done) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Flag className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar reporte</DialogTitle>
          <DialogDescription>
            Describe el motivo del reporte. El equipo de moderación lo revisará.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe el problema..."
          rows={4}
        />
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !reason.trim()}>
            Enviar reporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}