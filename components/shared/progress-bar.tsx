import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  className?: string
  showLabel?: boolean
}

function getColor(value: number): string {
  if (value >= 100) return "bg-green-500"
  if (value >= 75) return "bg-blue-500"
  if (value >= 50) return "bg-yellow-500"
  if (value >= 25) return "bg-orange-500"
  return "bg-red-500"
}

export function ProgressBar({ value, className, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div
          className={cn("h-2 rounded-full transition-all", getColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground w-10 text-right">
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
