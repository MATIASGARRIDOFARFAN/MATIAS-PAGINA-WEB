"use client"

import { BookOpen, Laptop, Ruler, Armchair, Backpack, LayoutGrid, type LucideIcon } from "lucide-react"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

const icons: Record<string, LucideIcon> = {
  BookOpen,
  Laptop,
  Ruler,
  Armchair,
  Backpack,
}

export function CategoryPills({
  active,
  onSelect,
}: {
  active: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Pill active={active === null} label="Todo" icon={LayoutGrid} onClick={() => onSelect(null)} />
      {categories.map((c) => (
        <Pill
          key={c.id}
          active={active === c.id}
          label={c.name}
          icon={icons[c.icon] ?? LayoutGrid}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  )
}

function Pill({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
