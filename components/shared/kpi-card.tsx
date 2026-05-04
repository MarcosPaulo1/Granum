import { cva, type VariantProps } from "class-variance-authority"
import { TrendingDown, TrendingUp } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const kpiCardVariants = cva(
  "relative flex flex-col gap-2 overflow-hidden rounded-md border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-transparent",
  {
    variants: {
      tone: {
        neutral: "",
        primary: "before:bg-primary",
        success: "before:bg-[var(--success)]",
        warning: "before:bg-[var(--warning)]",
        danger: "before:bg-destructive",
        info: "before:bg-[var(--info)]",
        planned: "before:bg-muted-foreground/40",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

const kpiIconVariants = cva(
  "inline-flex h-7 w-7 items-center justify-center rounded-md [&>svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-accent text-primary",
        success: "bg-[var(--success-soft)] text-[var(--success)]",
        warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
        danger: "bg-[var(--danger-soft)] text-destructive",
        info: "bg-[var(--info-soft)] text-[var(--info)]",
        planned: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

interface KpiCardProps extends VariantProps<typeof kpiCardVariants> {
  label: string
  value: ReactNode
  /** Texto secundário sob o valor. Use `trend` para colorir/ícone. */
  sub?: ReactNode
  trend?: "up" | "down" | "warn" | "neutral"
  icon?: ReactNode
  className?: string
  /** Renderizado em vez do `value` quando você precisa de markup customizado. */
  children?: ReactNode
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  icon,
  tone = "neutral",
  className,
  children,
}: KpiCardProps) {
  return (
    <div className={cn(kpiCardVariants({ tone }), className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          {label}
        </div>
        {icon ? (
          <div className={kpiIconVariants({ tone })}>{icon}</div>
        ) : null}
      </div>

      <div className="mono text-2xl font-medium leading-tight text-foreground">
        {children ?? value}
      </div>

      {sub ? (
        <div
          className={cn(
            "flex items-center gap-1 text-xs",
            trend === "up" && "text-[var(--success-ink)]",
            trend === "down" && "text-[var(--danger-ink)]",
            trend === "warn" && "text-[var(--warning-ink)]",
            (!trend || trend === "neutral") && "text-muted-foreground"
          )}
        >
          {trend === "up" ? <TrendingUp className="size-3" /> : null}
          {trend === "down" ? <TrendingDown className="size-3" /> : null}
          <span>{sub}</span>
        </div>
      ) : null}
    </div>
  )
}

interface KpiGridProps {
  cols?: 2 | 3 | 4 | 5
  className?: string
  children: ReactNode
}

const colClass: Record<NonNullable<KpiGridProps["cols"]>, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5",
}

export function KpiGrid({ cols = 4, className, children }: KpiGridProps) {
  return (
    <div className={cn("grid gap-3", colClass[cols], className)}>
      {children}
    </div>
  )
}
