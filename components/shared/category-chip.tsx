import { cva, type VariantProps } from "class-variance-authority"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-tight whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-accent text-primary",
        success: "bg-[var(--success-soft)] text-[var(--success-ink)]",
        warning: "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
        danger: "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
        info: "bg-[var(--info-soft)] text-[var(--info-ink)]",
        outline:
          "border border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

interface CategoryChipProps extends VariantProps<typeof chipVariants> {
  children: ReactNode
  className?: string
  icon?: ReactNode
}

export function CategoryChip({
  children,
  className,
  icon,
  tone,
}: CategoryChipProps) {
  return (
    <span className={cn(chipVariants({ tone }), className)}>
      {icon ? <span className="[&>svg]:size-3">{icon}</span> : null}
      {children}
    </span>
  )
}

export { chipVariants }
