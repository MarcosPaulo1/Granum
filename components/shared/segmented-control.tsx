"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string = string> {
  value: T
  label: ReactNode
  /** Contador opcional renderizado como pill cinza ao lado do label. */
  count?: number
}

interface SegmentedControlProps<T extends string = string> {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedOption<T>[]
  className?: string
  ariaLabel?: string
}

export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-muted p-[3px]",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-3 text-[12.5px] font-medium transition-colors",
              "h-[26px]",
              isActive
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(17,24,39,0.06)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
            {typeof opt.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums",
                  isActive
                    ? "bg-muted text-muted-foreground"
                    : "bg-card text-muted-foreground"
                )}
              >
                {opt.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
