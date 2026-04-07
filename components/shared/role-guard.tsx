"use client"

import { useUser } from "@/lib/hooks/use-user"
import type { Role } from "@/lib/constants"

interface RoleGuardProps {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { role, isLoading } = useUser()

  if (isLoading) return null
  if (!role || !roles.includes(role)) return <>{fallback}</>

  return <>{children}</>
}
