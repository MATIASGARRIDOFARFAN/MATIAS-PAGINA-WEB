import { cn } from "@/lib/utils"
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS, type ProductStatus } from "@/lib/types"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status as ProductStatus
  const label = PRODUCT_STATUS_LABELS[key] ?? status
  const colors = PRODUCT_STATUS_COLORS[key] ?? "bg-secondary text-secondary-foreground"

  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", colors, className)}>
      {label}
    </span>
  )
}
