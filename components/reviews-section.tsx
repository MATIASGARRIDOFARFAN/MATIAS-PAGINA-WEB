"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { normalizeAvatarUrl } from "@/lib/security"

interface Rating {
  id: string
  stars: number
  comment: string | null
  createdAt: string
  fromUser: { name: string; avatar: string }
}

export function ReviewsSection({ userId }: { userId: string }) {
  const [ratings, setRatings] = useState<Rating[]>([])

  useEffect(() => {
    fetch(`/api/ratings?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setRatings(d.ratings ?? []))
  }, [userId])

  if (ratings.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">Reseñas</h2>
      <div className="space-y-3">
        {ratings.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{r.fromUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{r.fromUser.name}</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < r.stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {r.comment && (
              <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}