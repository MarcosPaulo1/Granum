import { cn } from "@/lib/utils"

interface PresenceWeekProps {
  /** Quantos dias presentes na semana. */
  present: number
  /** Total de dias úteis. Default 6 (seg–sáb). */
  total?: number
  /** Mostra contador "X/Y" à direita das barras. */
  showCount?: boolean
  className?: string
}

export function PresenceWeek({
  present,
  total = 6,
  showCount = false,
  className,
}: PresenceWeekProps) {
  const safePresent = Math.max(0, Math.min(present, total))

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="inline-flex items-end gap-[2px]"
        aria-label={`${safePresent} de ${total} dias`}
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 w-1 rounded-[2px]",
              i < safePresent
                ? "bg-[var(--success)]"
                : "bg-[var(--input)]"
            )}
          />
        ))}
      </span>
      {showCount ? (
        <span className="mono text-xs font-medium text-foreground tabular-nums">
          {safePresent}/{total}
        </span>
      ) : null}
    </span>
  )
}
