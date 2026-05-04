import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  /** Pequeno tag/eyebrow acima do título (ex: "FINANCEIRO · LANÇAMENTO"). */
  eyebrow?: ReactNode
  title: ReactNode
  /** ID/identificador exibido como pill ao lado do título. */
  badge?: ReactNode
  /** Subtítulo de uma linha. */
  subtitle?: ReactNode
  /** Ações renderizadas à direita (botões, segmented, etc). */
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  badge,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
              {eyebrow}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
