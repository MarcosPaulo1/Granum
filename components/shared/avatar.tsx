import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-semibold uppercase",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-[11.5px]",
        md: "h-10 w-10 text-[13px]",
        lg: "h-12 w-12 text-sm",
        xl: "h-14 w-14 text-base",
      },
      variant: {
        /** Pessoa física — círculo, slate */
        pf: "rounded-full bg-muted text-muted-foreground",
        /** Pessoa jurídica — quadrado arredondado, indigo soft */
        pj: "rounded-md bg-accent text-primary",
        /** Usuário/sistema — círculo, indigo */
        user: "rounded-full bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "pf",
    },
  }
)

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Iniciais (até 2 caracteres). Se ausente, usa primeira letra de `name`. */
  initials?: string
  name?: string
  className?: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  initials,
  name,
  variant,
  size,
  className,
}: AvatarProps) {
  const text = initials ?? (name ? getInitials(name) : "?")
  return (
    <span
      className={cn(avatarVariants({ size, variant }), className)}
      aria-hidden="true"
    >
      {text}
    </span>
  )
}

export { avatarVariants }
