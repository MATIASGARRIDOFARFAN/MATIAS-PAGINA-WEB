"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (value.trim()) params.set("q", value.trim())
    router.push(`/?${params.toString()}#resultados`)
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca por producto, curso, carrera o facultad..."
        className="h-11 rounded-full border-border bg-secondary pl-11 pr-4 text-sm shadow-sm focus-visible:bg-background"
        aria-label="Buscar productos"
      />
    </form>
  )
}
