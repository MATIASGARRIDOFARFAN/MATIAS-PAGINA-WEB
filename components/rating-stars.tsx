"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function RatingStars({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: "sm" | "md"
}) {
  const sizeClass = size === "sm" ? "size-3.5" : "size-5"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(!readonly && "cursor-pointer hover:scale-110 transition-transform")}
          aria-label={`${star} estrellas`}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function RatingDisplay({
  average,
  count,
}: {
  average: number
  count: number
}) {
  if (count === 0) {
    return <span className="text-sm text-muted-foreground">Sin calificaciones</span>
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <RatingStars value={Math.round(average)} readonly size="sm" />
      <span className="font-medium">{average.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </div>
  )
}
