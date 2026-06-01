"use client"

import { useSearchParams } from "next/navigation"
import { InternalMessenger } from "@/components/internal-messenger"

export function ChatWrapper() {
  const params = useSearchParams()
  return (
    <InternalMessenger
      initialUserId={params.get("to") ?? undefined}
      initialProductId={params.get("product") ?? undefined}
    />
  )
}
